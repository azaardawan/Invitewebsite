import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import { customers, invitations, orderStatusHistory, orders, themes } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import type { RequestContext } from '@/server/auth/request-context';
import { consumeRateLimit } from '@/server/rate-limit';
import { getSettings } from '@/server/settings/service';
import { normalizePhone } from '@/lib/phone';
import { orderNumber } from '@/lib/ids';
import { OrderError, loadPurchasable, sameSet } from './common';
import { acceptedVersions } from '@/server/legal/policies';
import { trackEvent } from '@/server/analytics/events';
import { redeemCoupon } from './coupons';
import { markOrderPaid } from './payment';
import { findByPreviewToken } from './drafts';
import { accessCodeFor, accessCodeHash, receiptTokenFor, receiptTokenHash } from './tokens';
import { validateFieldValues } from './validation';

const customerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(30),
  email: z.email().max(254).transform((e) => e.toLowerCase()),
});

export type CheckoutInput = {
  previewToken: string;
  customer: { name: string; phone: string; email: string };
  acceptedTerms: boolean;
  /** Generated once per checkout screen; resubmits (double tap, refresh) reuse it. */
  idempotencyKey: string;
  /** Optional discount code from Admin → Coupons. */
  couponCode?: string;
};

export type CheckoutResult = { orderId: string; orderNumber: string; receiptToken: string; amountIqd: number; reused: boolean };

/**
 * Step 2 of buying: turns a draft into an order with an immutable snapshot of
 * exactly what is being bought and at what price. Payment (WAYL) comes next (M6).
 * Safe to call repeatedly: the same checkout never creates two orders.
 */
export async function createOrder(db: DbOrTx, input: CheckoutInput, ctx: RequestContext, now = new Date()): Promise<CheckoutResult> {
  if (!input.acceptedTerms) throw new OrderError('termsRequired');
  const c = customerSchema.safeParse(input.customer);
  const phone = c.success ? normalizePhone(c.data.phone) : null;
  if (!c.success || !phone) throw new OrderError('invalidCustomer', phone ? {} : { phone: 'invalidPhone' });
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(input.idempotencyKey)) throw new OrderError('invalidCustomer');

  const reuse = (order: typeof orders.$inferSelect): CheckoutResult => ({
    orderId: order.id,
    orderNumber: order.orderNumber,
    receiptToken: receiptTokenFor(order.id),
    amountIqd: order.amountIqd,
    reused: true,
  });

  const [existing] = await db.select().from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey));
  if (existing) return reuse(existing);
  if (ctx.ipHash && !(await consumeRateLimit(db, `checkout:${ctx.ipHash}`, 10, 3600, now))) throw new OrderError('rateLimited');

  return db.transaction(async (tx) => {
    const draft = await findByPreviewToken(tx, input.previewToken, now);
    if (!draft) throw new OrderError('previewExpired');
    const [inv] = await tx.select().from(invitations).where(eq(invitations.id, draft.id)).for('update');

    // A second tap/tab after the order exists: return that order instead of creating another.
    const [active] = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.invitationId, inv!.id), inArray(orders.status, ['PENDING', 'AWAITING_PAYMENT', 'PAID'])));
    if (active) return reuse(active);
    if (inv!.status !== 'DRAFT') throw new OrderError('locked');

    // Re-check availability and price now (the theme may have been archived or re-priced since the draft).
    const [themeRow] = await tx.select({ key: themes.key }).from(themes).where(eq(themes.id, inv!.themeId));
    const p = await loadPurchasable(tx, themeRow!.key, inv!.packageId);
    if (p.version.id !== inv!.themeVersionId || !sameSet(p.pkg.fieldKeys, inv!.fieldKeys) || !sameSet(p.pkg.featureKeys, inv!.featureKeys)) {
      throw new OrderError('packageChanged');
    }
    const fields = validateFieldValues(inv!.fieldValues, inv!.fieldKeys, p.defs, now);
    if (!fields.ok) throw new OrderError('invalidFields', fields.errors);

    const [customer] = await tx
      .insert(customers)
      .values({ name: c.data.name, phoneE164: phone, email: c.data.email })
      .returning();
    const { currency } = await getSettings(tx);
    const snapshot = {
      theme: { id: p.theme.id, key: p.theme.key, name: p.theme.name },
      themeVersion: { id: p.version.id, codeRef: p.version.codeRef },
      section: p.section ? { id: p.section.id, key: p.section.key, name: p.section.name } : null,
      package: {
        id: p.pkg.id,
        name: p.pkg.name,
        description: p.pkg.description,
        priceIqd: p.pkg.priceIqd,
        fieldKeys: p.pkg.fieldKeys,
        featureKeys: p.pkg.featureKeys,
      },
      customer: { name: c.data.name, phone, email: c.data.email },
      invitation: { publicId: inv!.publicId, locale: inv!.locale, fieldValues: fields.values },
      pricing: { amountIqd: p.pkg.priceIqd, currency: 'IQD', displayUsdRateIqd: currency.usdRateIqd } as {
        amountIqd: number;
        currency: 'IQD';
        displayUsdRateIqd: number | null;
        listPriceIqd?: number;
        discountIqd?: number;
        couponCode?: string | null;
      },
      createdAt: now.toISOString(),
    };

    // Coupon: checked and counted inside this transaction; a 100% coupon leaves nothing to pay.
    const coupon = input.couponCode?.trim() ? await redeemCoupon(tx, input.couponCode, p.pkg.priceIqd, now) : null;
    const amountIqd = p.pkg.priceIqd - (coupon?.discountIqd ?? 0);
    snapshot.pricing = { ...snapshot.pricing, amountIqd, listPriceIqd: p.pkg.priceIqd, discountIqd: coupon?.discountIqd ?? 0, couponCode: coupon?.code ?? null };

    const legal = await acceptedVersions(tx);
    let order: typeof orders.$inferSelect | undefined;
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      [order] = await tx
        .insert(orders)
        .values({
          orderNumber: orderNumber(),
          customerId: customer!.id,
          invitationId: inv!.id,
          amountIqd,
          couponId: coupon?.couponId ?? null,
          discountIqd: coupon?.discountIqd ?? 0,
          snapshot,
          legalAcceptance: { ...legal, acceptedAt: now.toISOString(), ipHash: ctx.ipHash, userAgent: ctx.userAgent },
          receiptTokenHash: 'pending',
          idempotencyKey: input.idempotencyKey,
        })
        .onConflictDoNothing({ target: orders.orderNumber })
        .returning();
    }
    if (!order) throw new Error('Could not allocate an order number');
    const receiptToken = receiptTokenFor(order.id);
    await tx
      .update(orders)
      .set({ receiptTokenHash: receiptTokenHash(receiptToken), accessCodeHash: accessCodeHash(accessCodeFor(order.id)) })
      .where(eq(orders.id, order.id));
    await tx
      .update(invitations)
      .set({ status: 'AWAITING_PAYMENT', fieldValues: fields.values, musicTrackId: p.theme.musicTrackId })
      .where(eq(invitations.id, inv!.id));
    await tx.insert(orderStatusHistory).values({ orderId: order.id, fromStatus: null, toStatus: 'PENDING', actorType: 'CUSTOMER' });
    await recordAudit(tx, {
      actorType: 'CUSTOMER',
      action: 'order.created',
      objectType: 'order',
      objectId: order.id,
      after: { orderNumber: order.orderNumber, amountIqd: order.amountIqd, theme: p.theme.key, package: p.pkg.id, coupon: coupon?.code ?? null, discountIqd: coupon?.discountIqd ?? 0 },
      ipHash: ctx.ipHash,
    });
    await trackEvent(tx, { name: 'order_placed', locale: inv!.locale, themeId: p.theme.id, packageId: p.pkg.id, invitationId: inv!.id, orderId: order.id, occurredAt: now });
    if (amountIqd === 0) await markOrderPaid(tx, order.id, { kind: 'COUPON', code: coupon!.code }, now);
    return { orderId: order.id, orderNumber: order.orderNumber, receiptToken, amountIqd: order.amountIqd, reused: false };
  });
}

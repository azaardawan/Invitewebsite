import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, coupons, invitations, orders } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { couponDiscount, createCoupon, setCouponStatus } from '@/server/orders/coupons';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
let actor: { adminId: string; ipHash: null };
beforeAll(async () => {
  shop = await activeTheme();
  actor = { adminId: shop.admin.id, ipHash: null };
});

async function checkout(couponCode?: string) {
  const visitor = { ...ctx, ipHash: randomToken(8) };
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues() }, visitor);
  return createOrder(
    db(),
    { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18), couponCode },
    visitor,
  );
}
const code = () => `T${randomToken(6).replace(/[^A-Za-z0-9]/g, 'X').toUpperCase()}`;

describe('coupons', () => {
  it('computes percentage and amount discounts, never above the price', () => {
    expect(couponDiscount({ kind: 'PERCENT', value: 50 }, 75000)).toBe(37500);
    expect(couponDiscount({ kind: 'AMOUNT', value: 10000 }, 75000)).toBe(10000);
    expect(couponDiscount({ kind: 'AMOUNT', value: 900000 }, 75000)).toBe(75000);
  });

  it('takes the discount off the order, records it and counts the use', async () => {
    const c = await createCoupon(db(), { code: `  ${code().toLowerCase()} `, kind: 'PERCENT', value: 50 }, actor);
    expect(c.code).toMatch(/^[A-Z0-9-]+$/);
    const o = await checkout(c.code.toLowerCase());
    const [row] = await db().select().from(orders).where(eq(orders.id, o.orderId));
    expect(row!.discountIqd).toBe(Math.round(shop.full.priceIqd / 2));
    expect(row!.amountIqd).toBe(shop.full.priceIqd - row!.discountIqd);
    expect(row!.couponId).toBe(c.id);
    expect(row!.status).not.toBe('PAID');
    expect((row!.snapshot as { pricing: { couponCode: string } }).pricing.couponCode).toBe(c.code);
    expect((await db().select().from(coupons).where(eq(coupons.id, c.id)))[0]!.usedCount).toBe(1);
  });

  it('a 100% coupon makes the order free: paid and published at once', async () => {
    const c = await createCoupon(db(), { code: code(), kind: 'PERCENT', value: 100, maxUses: 1, note: 'owner' }, actor);
    const o = await checkout(c.code);
    expect(o.amountIqd).toBe(0);
    const [row] = await db().select().from(orders).where(eq(orders.id, o.orderId));
    expect(row!.status).toBe('PAID');
    expect(row!.invoiceNumber).toBeTruthy();
    const [inv] = await db().select().from(invitations).where(eq(invitations.id, row!.invitationId));
    expect(inv!.status).toBe('PUBLISHED');
    const logs = await db().select().from(auditLogs).where(eq(auditLogs.objectId, o.orderId));
    expect(logs.map((l) => l.action)).toContain('order.paid_by_coupon');
    // One use only.
    await expect(checkout(c.code)).rejects.toMatchObject({ code: 'invalidCoupon' });
  });

  it('refuses unknown, stopped and expired codes (and the order is not created)', async () => {
    await expect(checkout('NO-SUCH-CODE')).rejects.toMatchObject({ code: 'invalidCoupon' });
    const stopped = await createCoupon(db(), { code: code(), kind: 'AMOUNT', value: 5000 }, actor);
    await setCouponStatus(db(), stopped.id, 'ARCHIVED', actor);
    await expect(checkout(stopped.code)).rejects.toMatchObject({ code: 'invalidCoupon' });
    const expired = await createCoupon(db(), { code: code(), kind: 'AMOUNT', value: 5000, expiresAt: new Date(Date.now() - 1000) }, actor);
    await expect(checkout(expired.code)).rejects.toMatchObject({ code: 'invalidCoupon' });
    expect((await db().select().from(coupons).where(eq(coupons.id, expired.id)))[0]!.usedCount).toBe(0);
  });

  it('validates new coupons', async () => {
    await expect(createCoupon(db(), { code: 'x', kind: 'PERCENT', value: 10 }, actor)).rejects.toThrow();
    await expect(createCoupon(db(), { code: code(), kind: 'PERCENT', value: 120 }, actor)).rejects.toThrow();
    const c = await createCoupon(db(), { code: code(), kind: 'PERCENT', value: 10 }, actor);
    await expect(createCoupon(db(), { code: c.code, kind: 'PERCENT', value: 10 }, actor)).rejects.toMatchObject({ code: 'keyTaken' });
  });
});

import { beforeAll, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, invitations, orderStatusHistory, orders } from '@/server/db/schema';
import { createDraft, findByPreviewToken, updateDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { isLive, markOrderPaid } from '@/server/orders/payment';
import { getReceipt } from '@/server/orders/receipt';
import { transitionTheme } from '@/server/catalog/themes';
import { updatePackage } from '@/server/catalog/packages';
import { randomToken } from '@/lib/crypto';
import { activeTheme, BASIC_FIELDS, FULL_FIELDS, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

const customer = { name: 'حسين علي', phone: '0770 123 4567', email: 'Buyer@Example.com' };
const key = () => randomToken(18);
/** A fresh visitor (own IP hash) so rate limits don't interfere between tests. */
const visitor = () => ({ ...ctx, ipHash: randomToken(8) });

async function draft(values = weddingValues(), pkg = shop.full.id) {
  return createDraft(db(), { themeKey: shop.theme.key, packageId: pkg, locale: 'ar', values }, { ...ctx, ipHash: randomToken(8) });
}

describe('drafts and preview links', () => {
  it('creates a private draft; the preview token finds it until it expires', async () => {
    const d = await draft();
    const found = await findByPreviewToken(db(), d.previewToken);
    expect(found?.status).toBe('DRAFT');
    expect(found?.slug).toBe('ali-nor');
    expect([...found!.fieldKeys].sort()).toEqual([...FULL_FIELDS].sort());
    expect(await findByPreviewToken(db(), d.previewToken, new Date(Date.now() + 25 * 3600_000))).toBeNull();
    expect(await findByPreviewToken(db(), 'wrong-token')).toBeNull();
  });

  it('rejects missing fields, with per-field errors', async () => {
    await expect(draft(weddingValues({ venue_map_url: '' }))).rejects.toMatchObject({
      code: 'invalidFields',
      fieldErrors: { venue_map_url: 'required' },
    });
  });

  it('a lower package only requires (and only keeps) its own fields', async () => {
    const d = await draft({ ...weddingValues(), venue_map_url: 'not even a url' }, shop.basic.id);
    const found = await findByPreviewToken(db(), d.previewToken);
    expect(Object.keys(found!.fieldValues).sort()).toEqual([...BASIC_FIELDS].sort());
  });

  it('edits are revalidated and refresh the slug', async () => {
    const d = await draft();
    await updateDraft(db(), d.previewToken, { values: weddingValues({ person_1_name: 'Sara', person_2_name: 'Yusuf' }) });
    expect((await findByPreviewToken(db(), d.previewToken))?.slug).toBe('sara-yusuf');
    await expect(updateDraft(db(), d.previewToken, { values: weddingValues({ event_time: 'noon' }) })).rejects.toMatchObject({
      code: 'invalidFields',
    });
  });

  it('only themes on sale can be bought', async () => {
    const other = await activeTheme();
    await transitionTheme(db(), other.theme.id, 'ARCHIVED', other.actor);
    await expect(
      createDraft(db(), { themeKey: other.theme.key, packageId: other.full.id, locale: 'ar', values: weddingValues() }, ctx),
    ).rejects.toMatchObject({ code: 'notAvailable' });
    await expect(
      createDraft(db(), { themeKey: shop.theme.key, packageId: other.full.id, locale: 'ar', values: weddingValues() }, ctx),
    ).rejects.toMatchObject({ code: 'notAvailable' });
  });
});

describe('checkout', () => {
  it('requires accepted terms and valid contact details', async () => {
    const d = await draft();
    await expect(createOrder(db(), { previewToken: d.previewToken, customer, acceptedTerms: false, idempotencyKey: key() }, visitor())).rejects.toMatchObject({
      code: 'termsRequired',
    });
    await expect(
      createOrder(db(), { previewToken: d.previewToken, customer: { ...customer, phone: '123' }, acceptedTerms: true, idempotencyKey: key() }, visitor()),
    ).rejects.toMatchObject({ code: 'invalidCustomer' });
  });

  it('creates one order with an immutable snapshot, and double taps return the same order', async () => {
    const d = await draft();
    const k = key();
    const first = await createOrder(db(), { previewToken: d.previewToken, customer, acceptedTerms: true, idempotencyKey: k }, visitor());
    const sameKey = await createOrder(db(), { previewToken: d.previewToken, customer, acceptedTerms: true, idempotencyKey: k }, visitor());
    const otherTab = await createOrder(db(), { previewToken: d.previewToken, customer, acceptedTerms: true, idempotencyKey: key() }, visitor());
    expect(sameKey).toMatchObject({ orderNumber: first.orderNumber, receiptToken: first.receiptToken, reused: true });
    expect(otherTab.orderNumber).toBe(first.orderNumber);
    expect(first.amountIqd).toBe(60000);

    const [order] = await db().select().from(orders).where(eq(orders.orderNumber, first.orderNumber));
    expect(order!.status).toBe('PENDING');
    expect(order!.invoiceNumber).toBeNull();
    expect(order!.snapshot).toMatchObject({
      package: { priceIqd: 60000 },
      customer: { phone: '+9647701234567', email: 'buyer@example.com' },
      pricing: { currency: 'IQD' },
    });
    expect(order!.legalAcceptance).toMatchObject({ terms: 'draft-2026-09', refund: 'draft-2026-09' });
    const [inv] = await db().select().from(invitations).where(eq(invitations.id, order!.invitationId));
    expect(inv!.status).toBe('AWAITING_PAYMENT');
    expect(inv!.musicTrackId).toBe(shop.song.id);
  });

  it('old orders keep their price after the package is re-priced', async () => {
    const d = await draft(weddingValues(), shop.basic.id);
    const o = await createOrder(db(), { previewToken: d.previewToken, customer, acceptedTerms: true, idempotencyKey: key() }, visitor());
    await updatePackage(
      db(),
      shop.basic.id,
      { name: { ar: 'عادي', en: 'Normal' }, priceIqd: 40000, fieldKeys: [...BASIC_FIELDS], featureKeys: ['music', 'print_card'] },
      shop.actor,
    );
    const receipt = await getReceipt(db(), o.receiptToken);
    expect(receipt?.amountIqd).toBe(25000);
    expect(receipt?.snapshot.package.priceIqd).toBe(25000);
    // A new draft of the same package pays the new price.
    const d2 = await draft(weddingValues(), shop.basic.id);
    const o2 = await createOrder(db(), { previewToken: d2.previewToken, customer, acceptedTerms: true, idempotencyKey: key() }, visitor());
    expect(o2.amountIqd).toBe(40000);
  });

  it('refuses to check out if the theme was archived after the draft', async () => {
    const other = await activeTheme();
    const d = await createDraft(db(), { themeKey: other.theme.key, packageId: other.full.id, locale: 'en', values: weddingValues() }, ctx);
    await transitionTheme(db(), other.theme.id, 'ARCHIVED', other.actor);
    await expect(createOrder(db(), { previewToken: d.previewToken, customer, acceptedTerms: true, idempotencyKey: key() }, visitor())).rejects.toMatchObject({
      code: 'notAvailable',
    });
  });
});

describe('payment, invoice and publication', () => {
  async function pendingOrder() {
    const d = await draft();
    return createOrder(db(), { previewToken: d.previewToken, customer, acceptedTerms: true, idempotencyKey: key() }, visitor());
  }

  it('marks paid once, assigns a gap-free invoice number and publishes for exactly 30 days', async () => {
    const o = await pendingOrder();
    const now = new Date('2026-10-15T09:00:00Z');
    const first = await markOrderPaid(db(), o.orderId, { kind: 'WAYL' }, now);
    const again = await markOrderPaid(db(), o.orderId, { kind: 'WAYL' }, now);
    expect(again).toEqual({ alreadyPaid: true, invoiceNumber: first.invoiceNumber });
    expect(first.invoiceNumber).toMatch(/^INV-2026-\d{5}$/);

    const receipt = await getReceipt(db(), o.receiptToken, now);
    expect(receipt?.status).toBe('PAID');
    expect(receipt?.invitation.publishedAt?.toISOString()).toBe(now.toISOString());
    expect(receipt?.invitation.expiresAt?.toISOString()).toBe('2026-11-14T09:00:00.000Z');
    expect(receipt?.invitation.path).toMatch(/^\/i\/ali-nor-[0-9a-z]{10}$/);
    expect(receipt?.invitation.live).toBe(true);

    const [inv] = await db().select().from(invitations).where(sql`${invitations.publicId} = ${receipt!.snapshot.invitation.publicId}`);
    expect(isLive(inv!, new Date('2026-11-14T08:59:59Z'))).toBe(true);
    expect(isLive(inv!, new Date('2026-11-14T09:00:00Z'))).toBe(false);
    expect(inv!.previewTokenHash).toBeNull(); // the preview link stops working once published
  });

  it('invoice numbers are sequential with no gaps, even for simultaneous confirmations', async () => {
    const pending = await Promise.all([pendingOrder(), pendingOrder(), pendingOrder(), pendingOrder()]);
    const now = new Date('2027-01-02T10:00:00Z');
    // Each order confirmed twice at the same moment (webhook + redirect check racing).
    const results = await Promise.all(pending.flatMap((o) => [markOrderPaid(db(), o.orderId, { kind: 'WAYL' }, now), markOrderPaid(db(), o.orderId, { kind: 'WAYL' }, now)]));
    const numbers = [...new Set(results.map((r) => r.invoiceNumber))].sort();
    expect(numbers).toHaveLength(4);
    const seq = numbers.map((n) => Number(n.slice(-5)));
    expect(seq).toEqual([seq[0], seq[0]! + 1, seq[0]! + 2, seq[0]! + 3]);
    expect(numbers[0]).toMatch(/^INV-2027-/);
  });

  it('manual publication records who and why, and a later webhook changes nothing', async () => {
    const o = await pendingOrder();
    const manual = await markOrderPaid(db(), o.orderId, { kind: 'MANUAL', adminId: shop.admin.id, reason: 'WAYL outage, payment confirmed by phone' });
    const webhook = await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
    expect(webhook).toEqual({ alreadyPaid: true, invoiceNumber: manual.invoiceNumber });
    const history = await db().select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, o.orderId));
    expect(history.map((h) => h.toStatus)).toEqual(['PENDING', 'PAID']);
    expect(history[1]).toMatchObject({ actorType: 'ADMIN', actorAdminId: shop.admin.id, reason: 'WAYL outage, payment confirmed by phone' });
    const logs = await db().select().from(auditLogs).where(eq(auditLogs.objectId, o.orderId));
    expect(logs.map((l) => l.action)).toContain('order.marked_paid_manually');
  });
});

describe('abuse protection', () => {
  it('limits checkouts per visitor', async () => {
    const { consumeRateLimit } = await import('@/server/rate-limit');
    const k = `test:${randomToken(6)}`;
    const now = new Date('2026-10-01T10:00:00Z');
    for (let i = 0; i < 3; i++) expect(await consumeRateLimit(db(), k, 3, 3600, now)).toBe(true);
    expect(await consumeRateLimit(db(), k, 3, 3600, now)).toBe(false);
    expect(await consumeRateLimit(db(), k, 3, 3600, new Date('2026-10-01T11:00:01Z'))).toBe(true);
  });
});

describe('receipts', () => {
  it('are only reachable with the private token; knowing the order number grants nothing', async () => {
    const d = await draft();
    const o = await createOrder(db(), { previewToken: d.previewToken, customer, acceptedTerms: true, idempotencyKey: key() }, visitor());
    expect(await getReceipt(db(), o.receiptToken)).not.toBeNull();
    expect(await getReceipt(db(), o.orderNumber)).toBeNull();
    expect(await getReceipt(db(), o.receiptToken.slice(0, -1) + 'x')).toBeNull();
    expect(o.receiptToken.length).toBeGreaterThanOrEqual(43);
  });
});

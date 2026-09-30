import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, invitations, orders, paymentWebhookEvents, payments } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { setWaylClientForTests } from '@/server/payments/wayl';
import {
  handleWaylWebhook,
  LINK_TTL,
  ORDER_PAYMENT_WINDOW_MS,
  reconcilePayments,
  startPayment,
  verifyLatestForOrder,
  webhookSecretFor,
} from '@/server/payments/service';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';
import { fakeWayl } from '../fakes/wayl';

let shop: Awaited<ReturnType<typeof activeTheme>>;
let wayl: ReturnType<typeof fakeWayl>;
beforeAll(async () => {
  shop = await activeTheme();
});
beforeEach(() => {
  wayl = fakeWayl();
  setWaylClientForTests(wayl.client);
});
afterEach(() => setWaylClientForTests(null));

async function newOrder(now = new Date()) {
  const visitor = { ...ctx, ipHash: randomToken(8) };
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues() }, visitor, now);
  return createOrder(
    db(),
    { previewToken: d.previewToken, customer: { name: 'حسين علي', phone: '07701234567', email: 'b@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) },
    visitor,
    now,
  );
}

const paymentsOf = (orderId: string) => db().select().from(payments).where(eq(payments.orderId, orderId)).orderBy(payments.attempt);
const orderRow = async (id: string) => (await db().select().from(orders).where(eq(orders.id, id)))[0]!;

describe('starting a payment', () => {
  it('creates one WAYL link with our reference, amount, webhook and return URL; repeat taps reuse it', async () => {
    const o = await newOrder();
    const first = await startPayment(db(), o.orderId);
    expect(first).toMatchObject({ kind: 'redirect', url: 'https://pay.test/1' });
    const again = await startPayment(db(), o.orderId);
    expect(again).toEqual(first);
    const [p] = await paymentsOf(o.orderId);
    expect(p).toMatchObject({ providerReference: `${o.orderNumber}-1`, amountIqd: o.amountIqd, status: 'PENDING', providerEnv: 'test' });
    const link = wayl.links.get(p!.providerReference)!;
    expect(link.input).toMatchObject({ totalIqd: o.amountIqd, env: 'test', linkExpiresIn: '2h', webhookUrl: 'http://localhost:3000/api/webhooks/wayl' });
    expect(link.input.redirectionUrl).toBe(`http://localhost:3000/r/${o.receiptToken}?paid=1`);
    expect(link.input.webhookSecret).toBe(webhookSecretFor(p!.providerReference));
    expect((await orderRow(o.orderId)).status).toBe('AWAITING_PAYMENT');
  });

  it('without an API key, payment is collected manually', async () => {
    setWaylClientForTests(null);
    const o = await newOrder();
    expect(await startPayment(db(), o.orderId)).toEqual({ kind: 'manual' });
  });

  it('an expired link is checked first; if it was paid, no new link is made', async () => {
    const o = await newOrder();
    await startPayment(db(), o.orderId);
    wayl.pay(`${o.orderNumber}-1`);
    const later = new Date(Date.now() + LINK_TTL.ms + 60_000);
    expect(await startPayment(db(), o.orderId, later)).toEqual({ kind: 'paid' });
    expect(await paymentsOf(o.orderId)).toHaveLength(1);
    expect((await orderRow(o.orderId)).status).toBe('PAID');
  });

  it('an expired unpaid link is closed at WAYL and a new attempt is issued', async () => {
    const o = await newOrder();
    await startPayment(db(), o.orderId);
    const later = new Date(Date.now() + LINK_TTL.ms + 60_000);
    const r = await startPayment(db(), o.orderId, later);
    expect(r).toMatchObject({ kind: 'redirect', url: 'https://pay.test/2' });
    const [a, b] = await paymentsOf(o.orderId);
    expect(a!.status).toBe('EXPIRED');
    expect(wayl.links.get(a!.providerReference)!.status).toBe('Cancelled');
    expect(b).toMatchObject({ attempt: 2, providerReference: `${o.orderNumber}-2`, status: 'PENDING' });
  });

  it('WAYL down: friendly error, the order stays payable, the next tap works', async () => {
    const o = await newOrder();
    wayl.failNextCreate(0);
    expect(await startPayment(db(), o.orderId)).toEqual({ kind: 'error' });
    // The unconfirmed attempt is checked (not found at WAYL) and replaced.
    const later = new Date(Date.now() + 2 * 60_000);
    expect(await startPayment(db(), o.orderId, later)).toMatchObject({ kind: 'redirect' });
    expect((await paymentsOf(o.orderId)).map((p) => p.status)).toEqual(['FAILED', 'PENDING']);
  });

  it('a paid order is never sent to pay again', async () => {
    const o = await newOrder();
    await startPayment(db(), o.orderId);
    wayl.pay(`${o.orderNumber}-1`);
    await verifyLatestForOrder(db(), o.orderId);
    expect(await startPayment(db(), o.orderId)).toEqual({ kind: 'paid' });
  });
});

describe('confirming a payment', () => {
  it('the redirect alone proves nothing: unpaid stays unpaid', async () => {
    const o = await newOrder();
    await startPayment(db(), o.orderId);
    expect(await verifyLatestForOrder(db(), o.orderId)).toBe('OPEN');
    expect((await orderRow(o.orderId)).status).toBe('AWAITING_PAYMENT');
  });

  it('a verified payment marks the order paid, assigns an invoice and publishes the invitation', async () => {
    const o = await newOrder();
    await startPayment(db(), o.orderId);
    wayl.pay(`${o.orderNumber}-1`);
    expect(await verifyLatestForOrder(db(), o.orderId)).toBe('PAID');
    const order = await orderRow(o.orderId);
    expect(order.status).toBe('PAID');
    expect(order.invoiceNumber).toMatch(/^INV-\d{4}-\d{5}$/);
    const [inv] = await db().select().from(invitations).where(eq(invitations.id, order.invitationId));
    expect(inv!.status).toBe('PUBLISHED');
    const [p] = await paymentsOf(o.orderId);
    expect(p!.status).toBe('SUCCEEDED');
  });

  it('refuses a paid link whose amount or currency differs from the order', async () => {
    const o = await newOrder();
    await startPayment(db(), o.orderId);
    wayl.pay(`${o.orderNumber}-1`, { total: 1000 });
    expect(await verifyLatestForOrder(db(), o.orderId)).toBe('MISMATCH');
    expect((await orderRow(o.orderId)).status).toBe('AWAITING_PAYMENT');
    const [p] = await paymentsOf(o.orderId);
    expect(p!.problem).toContain('amount');
    const audits = await db().select().from(auditLogs).where(eq(auditLogs.objectId, p!.id));
    expect(audits.map((a) => a.action)).toContain('payment.verification_rejected');
  });
});

describe('webhooks', () => {
  const body = (ref: string, extra: object = {}) => Buffer.from(JSON.stringify({ referenceId: ref, status: 'Complete', ...extra }));
  const sign = (raw: Buffer, ref: string) => createHmac('sha256', webhookSecretFor(ref)).update(raw).digest('hex');

  it('a signed delivery triggers verification with WAYL; a duplicate is a no-op', async () => {
    const o = await newOrder();
    await startPayment(db(), o.orderId);
    const ref = `${o.orderNumber}-1`;
    wayl.pay(ref);
    const raw = body(ref);
    expect(await handleWaylWebhook(db(), raw, sign(raw, ref))).toEqual({ outcome: 'PAID' });
    expect(await handleWaylWebhook(db(), raw, sign(raw, ref))).toEqual({ outcome: 'duplicate' });
    const events = await db().select().from(paymentWebhookEvents).where(eq(paymentWebhookEvents.providerReference, ref));
    expect(events).toHaveLength(1);
    expect(events[0]!.signatureValid).toBe(true);
    expect((await orderRow(o.orderId)).invoiceNumber).not.toBeNull();
  });

  it('a forged "paid" delivery cannot mark anything paid', async () => {
    const o = await newOrder();
    await startPayment(db(), o.orderId);
    const ref = `${o.orderNumber}-1`;
    const raw = body(ref, { total: 999999 });
    expect(await handleWaylWebhook(db(), raw, 'sha256=deadbeef')).toEqual({ outcome: 'OPEN' });
    expect((await orderRow(o.orderId)).status).toBe('AWAITING_PAYMENT');
    const [ev] = await db().select().from(paymentWebhookEvents).where(eq(paymentWebhookEvents.providerReference, ref));
    expect(ev!.signatureValid).toBe(false);
  });

  it('unknown references and junk bodies are recorded and ignored', async () => {
    expect(await handleWaylWebhook(db(), Buffer.from(`not json ${randomToken(4)}`), null)).toEqual({ outcome: 'ignored' });
    expect(await handleWaylWebhook(db(), body(`ORD-NOPE-${randomToken(4)}`), null)).toEqual({ outcome: 'ignored' });
  });
});

describe('reconciliation', () => {
  it('catches a payment whose webhook never arrived', async () => {
    const o = await newOrder();
    await startPayment(db(), o.orderId);
    wayl.pay(`${o.orderNumber}-1`);
    const r = await reconcilePayments(db());
    expect(r.results.PAID).toBeGreaterThanOrEqual(1);
    expect((await orderRow(o.orderId)).status).toBe('PAID');
  });

  it('expires unpaid orders after the payment window', async () => {
    const past = new Date(Date.now() - ORDER_PAYMENT_WINDOW_MS - 3 * 3600_000);
    const o = await newOrder(past);
    await db().update(orders).set({ createdAt: past }).where(eq(orders.id, o.orderId));
    await startPayment(db(), o.orderId, past);
    await reconcilePayments(db());
    expect((await paymentsOf(o.orderId))[0]!.status).toBe('EXPIRED');
    expect((await orderRow(o.orderId)).status).toBe('PAYMENT_EXPIRED');
  });
});

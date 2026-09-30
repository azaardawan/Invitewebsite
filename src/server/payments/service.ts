import 'server-only';
import { createHmac } from 'node:crypto';
import { and, desc, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { orderStatusHistory, orders, paymentWebhookEvents, payments } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { env } from '@/server/env';
import { safeEqual, sha256Buffer } from '@/lib/crypto';
import { localized } from '@/lib/localized';
import { OrderError } from '@/server/orders/common';
import { markOrderPaid } from '@/server/orders/payment';
import type { OrderSnapshot } from '@/server/orders/receipt';
import { receiptTokenFor } from '@/server/orders/tokens';
import { linkOutcome, waylClient, WaylError } from './wayl';

/** How long one WAYL payment link stays open. A new link is issued after that. */
export const LINK_TTL = { wayl: '2h', ms: 2 * 3600_000 } as const;
/** An unpaid order can start new payment attempts (at its snapshot price) for this long, then it expires. */
export const ORDER_PAYMENT_WINDOW_MS = 48 * 3600_000;
/** Whether an unpaid order can still start a payment attempt. */
export function paymentWindowOpen(order: { status: string; createdAt: Date }, now = new Date()) {
  return (order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT') && now.getTime() - order.createdAt.getTime() < ORDER_PAYMENT_WINDOW_MS;
}

/** A link about to expire isn't handed out again; a fresh one is created instead. */
const REUSE_MARGIN_MS = 10 * 60_000;

/** Per-link webhook secret, derived so nothing extra has to be stored or configured. */
export function webhookSecretFor(reference: string) {
  return createHmac('sha256', Buffer.from(env().TOKEN_SECRET, 'base64')).update(`wayl-webhook:${reference}`).digest('hex');
}

/** HMAC-SHA256 of the raw body with the link's secret; accepts hex with or without a `sha256=` prefix. */
export function validWebhookSignature(raw: Buffer, header: string | null, secret: string) {
  if (!header) return false;
  const given = header.trim().replace(/^sha256=/i, '').toLowerCase();
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  return safeEqual(given, expected);
}

export type StartPaymentResult =
  | { kind: 'redirect'; url: string }
  | { kind: 'paid' }
  /** Online payment isn't configured; the team collects payment manually. */
  | { kind: 'manual' }
  /** A payment link is being created by another request right now. */
  | { kind: 'busy' }
  | { kind: 'error' };

/**
 * Sends the customer to WAYL for an order. Safe to call repeatedly: an open
 * link is reused, a paid order is never charged twice, and a stale link is
 * checked with WAYL (it may have been paid) before a new one is issued.
 */
export async function startPayment(db: DbOrTx, orderId: string, now = new Date()): Promise<StartPaymentResult> {
  const client = waylClient();
  if (!client) return { kind: 'manual' };

  // A previous link that is no longer reusable might still have been paid.
  const [latest] = await db.select().from(payments).where(eq(payments.orderId, orderId)).orderBy(desc(payments.attempt)).limit(1);
  if (latest && (latest.status === 'CREATED' || latest.status === 'PENDING') && !(latest.checkoutUrl && latest.linkExpiresAt.getTime() > now.getTime() + REUSE_MARGIN_MS)) {
    const young = !latest.checkoutUrl && now.getTime() - latest.createdAt.getTime() < 60_000;
    if (young) return { kind: 'busy' };
    try {
      await verifyPayment(db, latest.id, now, { closeIfOpen: true });
    } catch (e) {
      if (!(e instanceof WaylError)) throw e;
      return { kind: 'error' };
    }
  }

  // Phase 1 (order row locked): reuse an open link, or reserve the next attempt.
  const decision = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');
    if (!order) throw new OrderError('notFound');
    if (order.status === 'PAID') return { kind: 'paid' as const };
    if (order.status !== 'PENDING' && order.status !== 'AWAITING_PAYMENT') throw new OrderError('locked');
    if (now.getTime() - order.createdAt.getTime() > ORDER_PAYMENT_WINDOW_MS) throw new OrderError('locked');
    const [last] = await tx.select().from(payments).where(eq(payments.orderId, orderId)).orderBy(desc(payments.attempt)).limit(1);
    if (last && (last.status === 'CREATED' || last.status === 'PENDING')) {
      if (last.checkoutUrl && last.linkExpiresAt.getTime() > now.getTime() + REUSE_MARGIN_MS) return { kind: 'redirect' as const, url: last.checkoutUrl };
      if (!last.checkoutUrl) return { kind: 'busy' as const };
    }
    const attempt = (last?.attempt ?? 0) + 1;
    const [payment] = await tx
      .insert(payments)
      .values({
        orderId,
        attempt,
        providerReference: `${order.orderNumber}-${attempt}`,
        providerEnv: env().WAYL_ENV,
        amountIqd: order.amountIqd,
        linkExpiresAt: new Date(now.getTime() + LINK_TTL.ms),
      })
      .returning();
    return { kind: 'create' as const, payment: payment!, order };
  });
  if (decision.kind !== 'create') return decision;

  // Phase 2: create the link at WAYL (outside the lock). The payment row already
  // exists, so even a lost response is found again by its reference.
  const { payment, order } = decision;
  const snapshot = order.snapshot as OrderSnapshot;
  const base = env().APP_URL.replace(/\/$/, '');
  let link;
  try {
    link = await client.createLink({
      referenceId: payment.providerReference,
      totalIqd: payment.amountIqd,
      env: payment.providerEnv as 'live' | 'test',
      label: `${localized(snapshot.theme.name, 'en')} · ${localized(snapshot.package.name, 'en')}`,
      webhookUrl: `${base}/api/webhooks/wayl`,
      webhookSecret: webhookSecretFor(payment.providerReference),
      redirectionUrl: `${base}/r/${receiptTokenFor(order.id)}?paid=1`,
      linkExpiresIn: LINK_TTL.wayl,
    });
  } catch (e) {
    if (!(e instanceof WaylError)) throw e;
    // WAYL rejected it (e.g. 4xx): nothing to find later. Unreachable/5xx: keep it for reconciliation.
    if (e.status !== null && e.status < 500) await db.update(payments).set({ status: 'FAILED', problem: e.message.slice(0, 500) }).where(eq(payments.id, payment.id));
    else await db.update(payments).set({ problem: e.message.slice(0, 500) }).where(eq(payments.id, payment.id));
    console.error('[payments] create link failed', payment.providerReference, e.message);
    return { kind: 'error' };
  }
  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({ providerLinkId: link.id, checkoutUrl: link.url, providerStatus: link.status, status: 'PENDING', rawCreateResponse: link.raw })
      .where(eq(payments.id, payment.id));
    const [o] = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');
    if (o!.status === 'PENDING') {
      await tx.update(orders).set({ status: 'AWAITING_PAYMENT' }).where(eq(orders.id, orderId));
      await tx.insert(orderStatusHistory).values({ orderId, fromStatus: 'PENDING', toStatus: 'AWAITING_PAYMENT', actorType: 'SYSTEM' });
    }
  });
  return { kind: 'redirect', url: link.url };
}

export type VerifyResult = 'PAID' | 'OPEN' | 'FAILED' | 'EXPIRED' | 'MISMATCH' | 'RETURNED' | 'UNKNOWN';

/**
 * The only way a WAYL payment is accepted: its state is read from WAYL by our
 * reference (never from a webhook body or redirect), and the amount, currency
 * and reference must match the order before it is marked paid.
 */
export async function verifyPayment(db: DbOrTx, paymentId: string, now = new Date(), opts: { closeIfOpen?: boolean } = {}): Promise<VerifyResult> {
  const client = waylClient();
  if (!client) return 'UNKNOWN';
  const [p] = await db.select().from(payments).where(eq(payments.id, paymentId));
  if (!p) return 'UNKNOWN';
  if (p.status === 'SUCCEEDED') {
    await markOrderPaid(db, p.orderId, { kind: 'WAYL' }, now); // idempotent; repairs a paid-but-not-published crash
    return 'PAID';
  }

  const link = await client.getLink(p.providerReference);
  if (!link) {
    // Never created at WAYL (the create call failed before reaching it).
    const stale = now.getTime() - p.createdAt.getTime() > 10 * 60_000;
    if (stale || opts.closeIfOpen) await db.update(payments).set({ status: 'FAILED', lastCheckedAt: now, problem: p.problem ?? 'link not found at WAYL' }).where(eq(payments.id, p.id));
    return stale || opts.closeIfOpen ? 'FAILED' : 'UNKNOWN';
  }

  const outcome = linkOutcome(link.status);
  const seen = { providerStatus: link.status, rawVerifyResponse: link.raw, lastCheckedAt: now, providerLinkId: p.providerLinkId ?? link.id, checkoutUrl: p.checkoutUrl ?? (link.url || null) };

  if (outcome === 'PAID') {
    const problem =
      link.referenceId !== p.providerReference ? 'reference mismatch' : link.currency !== 'IQD' ? `currency ${link.currency}` : link.total !== p.amountIqd ? `amount ${link.total} ≠ ${p.amountIqd}` : null;
    if (problem) {
      if (p.problem !== problem) {
        await db.transaction(async (tx) => {
          await tx.update(payments).set({ ...seen, problem }).where(eq(payments.id, p.id));
          await recordAudit(tx, { actorType: 'SYSTEM', action: 'payment.verification_rejected', objectType: 'payment', objectId: p.id, after: { reference: p.providerReference, problem } });
        });
      }
      return 'MISMATCH';
    }
    await db.update(payments).set({ ...seen, status: 'SUCCEEDED', verifiedAt: now, problem: null }).where(eq(payments.id, p.id));
    await markOrderPaid(db, p.orderId, { kind: 'WAYL' }, now);
    return 'PAID';
  }
  if (outcome === 'FAILED') {
    await db.update(payments).set({ ...seen, status: 'FAILED' }).where(eq(payments.id, p.id));
    return 'FAILED';
  }
  if (outcome === 'RETURNED') {
    await db.update(payments).set({ ...seen, problem: 'returned by WAYL' }).where(eq(payments.id, p.id));
    return 'RETURNED';
  }
  // Still open at WAYL.
  if (p.linkExpiresAt <= now || opts.closeIfOpen) {
    await client.invalidateIfPending(p.providerReference);
    // Re-read: it could have been paid between the two calls.
    const again = await client.getLink(p.providerReference);
    if (again && linkOutcome(again.status) === 'PAID') return verifyPayment(db, paymentId, now);
    await db.update(payments).set({ ...seen, status: 'EXPIRED' }).where(eq(payments.id, p.id));
    return 'EXPIRED';
  }
  await db.update(payments).set(seen).where(eq(payments.id, p.id));
  return 'OPEN';
}

/** Checks the newest open payment of an order (used when the customer comes back from WAYL). */
export async function verifyLatestForOrder(db: DbOrTx, orderId: string, now = new Date()): Promise<VerifyResult> {
  const [p] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.orderId, orderId), inArray(payments.status, ['CREATED', 'PENDING', 'SUCCEEDED'])))
    .orderBy(desc(payments.attempt))
    .limit(1);
  return p ? verifyPayment(db, p.id, now) : 'UNKNOWN';
}

/**
 * Freshens an unpaid order's payment state when its receipt page is viewed
 * (e.g. right after the WAYL redirect). Throttled so reloads don't hammer WAYL;
 * WAYL being unreachable just leaves the state as it was.
 */
export async function refreshOrderPayment(db: DbOrTx, orderId: string, now = new Date()): Promise<VerifyResult> {
  if (!waylClient()) return 'UNKNOWN';
  const [p] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.orderId, orderId), inArray(payments.status, ['CREATED', 'PENDING', 'SUCCEEDED'])))
    .orderBy(desc(payments.attempt))
    .limit(1);
  if (!p) return 'UNKNOWN';
  if (p.status !== 'SUCCEEDED' && p.lastCheckedAt && now.getTime() - p.lastCheckedAt.getTime() < 3000) return 'OPEN';
  try {
    return await verifyPayment(db, p.id, now);
  } catch (e) {
    if (e instanceof WaylError) return 'UNKNOWN';
    throw e;
  }
}

/**
 * Safety net for missed webhooks, run on a schedule: re-checks open payments,
 * and expires unpaid orders whose payment window has passed.
 */
export async function reconcilePayments(db: DbOrTx, now = new Date()) {
  const open = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(inArray(payments.status, ['CREATED', 'PENDING']), gt(payments.createdAt, new Date(now.getTime() - ORDER_PAYMENT_WINDOW_MS - LINK_TTL.ms))));
  const results: Record<string, number> = {};
  for (const p of open) {
    let r: string;
    try {
      r = await verifyPayment(db, p.id, now);
    } catch (e) {
      r = 'ERROR';
      console.error('[payments] reconcile failed', p.id, (e as Error).message);
    }
    results[r] = (results[r] ?? 0) + 1;
  }

  // Unpaid orders past their window with no open payment left.
  const stale = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(
      and(
        inArray(orders.status, ['PENDING', 'AWAITING_PAYMENT']),
        lt(orders.createdAt, new Date(now.getTime() - ORDER_PAYMENT_WINDOW_MS)),
        sql`not exists (select 1 from ${payments} where ${payments.orderId} = ${orders.id} and ${payments.status} in ('CREATED', 'PENDING', 'SUCCEEDED'))`,
      ),
    );
  for (const o of stale) {
    await db.transaction(async (tx) => {
      const [locked] = await tx.select().from(orders).where(eq(orders.id, o.id)).for('update');
      if (!locked || (locked.status !== 'PENDING' && locked.status !== 'AWAITING_PAYMENT')) return;
      await tx.update(orders).set({ status: 'PAYMENT_EXPIRED' }).where(eq(orders.id, o.id));
      await tx.insert(orderStatusHistory).values({ orderId: o.id, fromStatus: locked.status, toStatus: 'PAYMENT_EXPIRED', actorType: 'SYSTEM' });
    });
  }
  return { checked: open.length, results, expiredOrders: stale.length };
}

/**
 * A WAYL webhook delivery. Stored first (deduplicated by body hash), then
 * treated only as a signal to re-verify with WAYL, so a forged or replayed
 * delivery can never mark anything paid.
 */
export async function handleWaylWebhook(db: DbOrTx, raw: Buffer, signature: string | null, now = new Date()) {
  let payload: unknown = null;
  try {
    payload = JSON.parse(raw.toString('utf8'));
  } catch {
    /* stored as null */
  }
  const obj = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === 'object' ? obj.data : {}) as Record<string, unknown>;
  const refRaw = obj.referenceId ?? data.referenceId;
  const reference = typeof refRaw === 'string' && refRaw.length <= 255 ? refRaw : null;
  const [payment] = reference ? await db.select().from(payments).where(eq(payments.providerReference, reference)) : [];
  const signatureValid = payment ? validWebhookSignature(raw, signature, webhookSecretFor(payment.providerReference)) : false;

  const [event] = await db
    .insert(paymentWebhookEvents)
    .values({ dedupeKey: sha256Buffer(raw), providerReference: reference, signatureValid, payload: payload ?? null })
    .onConflictDoNothing({ target: paymentWebhookEvents.dedupeKey })
    .returning({ id: paymentWebhookEvents.id });
  if (!event) return { outcome: 'duplicate' as const };
  if (!payment) {
    await db.update(paymentWebhookEvents).set({ processedAt: now, outcome: 'unknown reference' }).where(eq(paymentWebhookEvents.id, event.id));
    return { outcome: 'ignored' as const };
  }
  let outcome: string;
  try {
    outcome = await verifyPayment(db, payment.id, now);
  } catch (e) {
    outcome = `error: ${(e as Error).message.slice(0, 200)}`;
  }
  await db.update(paymentWebhookEvents).set({ processedAt: now, outcome }).where(eq(paymentWebhookEvents.id, event.id));
  return { outcome };
}

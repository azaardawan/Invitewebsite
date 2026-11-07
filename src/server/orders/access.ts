import 'server-only';
import { eq, isNull } from 'drizzle-orm';
import { recordAudit } from '@/server/audit/audit';
import { auditActor, type Actor } from '@/server/catalog/common';
import type { DbOrTx } from '@/server/db/client';
import { orders } from '@/server/db/schema';
import { consumeRateLimit } from '@/server/rate-limit';
import { accessCodeFor, accessCodeHash, normalizeAccessCode, receiptTokenFor, receiptTokenHash } from './tokens';
import { OrderError } from './common';

/** Guesses allowed per visitor (IP) per hour on the "My invitation" page. 10 digits = 10 billion numbers. */
export const ACCESS_RATE_LIMIT = { perIpPerHour: 10 } as const;

export type AccessLookup = { ok: true; receiptToken: string } | { ok: false; error: 'invalid' | 'notFound' | 'rateLimited' };

/** The customer's invitation number → their private receipt link (never reveals whether a number exists beyond "not found"). */
export async function lookupAccessCode(db: DbOrTx, input: string, ipHash: string | null, now = new Date()): Promise<AccessLookup> {
  const code = normalizeAccessCode(input);
  if (!code) return { ok: false, error: 'invalid' };
  if (ipHash && !(await consumeRateLimit(db, `access:${ipHash}`, ACCESS_RATE_LIMIT.perIpPerHour, 3600, now))) return { ok: false, error: 'rateLimited' };
  const [order] = await db.select({ id: orders.id, receiptKeyVersion: orders.receiptKeyVersion }).from(orders).where(eq(orders.accessCodeHash, accessCodeHash(code)));
  return order ? { ok: true, receiptToken: receiptTokenFor(order) } : { ok: false, error: 'notFound' };
}

/** Gives orders created before invitation numbers existed their number. Idempotent; runs with the deploy seed. */
export async function backfillAccessCodes(db: DbOrTx) {
  const missing = await db.select({ id: orders.id, receiptKeyVersion: orders.receiptKeyVersion }).from(orders).where(isNull(orders.accessCodeHash));
  for (const o of missing) {
    await db.update(orders).set({ accessCodeHash: accessCodeHash(accessCodeFor(o)) }).where(eq(orders.id, o.id));
  }
  return missing.length;
}

/**
 * Admin: replaces a customer's receipt link and invitation number. The old ones stop working at once (e.g. they
 * reached a staff member who has left, or the customer shared them by mistake). Audited, without the links themselves.
 * Returns the new link token and number, to send to the customer.
 */
export async function reissueCustomerLinks(db: DbOrTx, orderId: string, actor: Actor) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');
    if (!order) throw new OrderError('notFound');
    const next = { id: order.id, receiptKeyVersion: order.receiptKeyVersion + 1 };
    const receiptToken = receiptTokenFor(next);
    const accessCode = accessCodeFor(next);
    await tx
      .update(orders)
      .set({ receiptKeyVersion: next.receiptKeyVersion, receiptTokenHash: receiptTokenHash(receiptToken), accessCodeHash: accessCodeHash(accessCode) })
      .where(eq(orders.id, order.id));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'order.links_reissued',
      objectType: 'order',
      objectId: order.id,
      before: { receiptKeyVersion: order.receiptKeyVersion },
      after: { receiptKeyVersion: next.receiptKeyVersion },
    });
    return { receiptToken, accessCode };
  });
}


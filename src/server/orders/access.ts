import 'server-only';
import { eq, isNull } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { orders } from '@/server/db/schema';
import { consumeRateLimit } from '@/server/rate-limit';
import { accessCodeFor, accessCodeHash, normalizeAccessCode, receiptTokenFor } from './tokens';

/** Guesses allowed per visitor (IP) per hour on the "My invitation" page. 10 digits = 10 billion numbers. */
export const ACCESS_RATE_LIMIT = { perIpPerHour: 10 } as const;

export type AccessLookup = { ok: true; receiptToken: string } | { ok: false; error: 'invalid' | 'notFound' | 'rateLimited' };

/** The customer's invitation number → their private receipt link (never reveals whether a number exists beyond "not found"). */
export async function lookupAccessCode(db: DbOrTx, input: string, ipHash: string | null, now = new Date()): Promise<AccessLookup> {
  const code = normalizeAccessCode(input);
  if (!code) return { ok: false, error: 'invalid' };
  if (ipHash && !(await consumeRateLimit(db, `access:${ipHash}`, ACCESS_RATE_LIMIT.perIpPerHour, 3600, now))) return { ok: false, error: 'rateLimited' };
  const [order] = await db.select({ id: orders.id }).from(orders).where(eq(orders.accessCodeHash, accessCodeHash(code)));
  return order ? { ok: true, receiptToken: receiptTokenFor(order.id) } : { ok: false, error: 'notFound' };
}

/** Gives orders created before invitation numbers existed their number. Idempotent; runs with the deploy seed. */
export async function backfillAccessCodes(db: DbOrTx) {
  const missing = await db.select({ id: orders.id }).from(orders).where(isNull(orders.accessCodeHash));
  for (const o of missing) {
    await db.update(orders).set({ accessCodeHash: accessCodeHash(accessCodeFor(o.id)) }).where(eq(orders.id, o.id));
  }
  return missing.length;
}

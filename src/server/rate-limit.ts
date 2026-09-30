import 'server-only';
import { and, lt, sql } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { rateLimitBuckets } from '@/server/db/schema';

/**
 * Fixed-window counter. Returns true if the action is allowed (and counts it).
 * Keys look like `checkout:ip:<hash>`; never put raw personal data in a key.
 */
export async function consumeRateLimit(db: DbOrTx, key: string, limit: number, windowSeconds: number, now = new Date()) {
  const windowStart = new Date(Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const [row] = await db
    .insert(rateLimitBuckets)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimitBuckets.key, rateLimitBuckets.windowStart],
      set: { count: sql`${rateLimitBuckets.count} + 1` },
    })
    .returning({ count: rateLimitBuckets.count });
  return (row?.count ?? 0) <= limit;
}

/** Housekeeping (scheduled job in M11): drop windows older than a day. */
export async function pruneRateLimits(db: DbOrTx, now = new Date()) {
  await db.delete(rateLimitBuckets).where(and(lt(rateLimitBuckets.windowStart, new Date(now.getTime() - 86400_000))));
}

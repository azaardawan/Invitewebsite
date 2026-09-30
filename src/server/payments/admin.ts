import 'server-only';
import { desc, inArray } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { payments } from '@/server/db/schema';

/** The newest payment attempt of each order, for the admin order list. */
export async function latestPayments(db: DbOrTx, orderIds: string[]) {
  const map = new Map<string, typeof payments.$inferSelect>();
  if (!orderIds.length) return map;
  const rows = await db.select().from(payments).where(inArray(payments.orderId, orderIds)).orderBy(desc(payments.attempt));
  for (const r of rows) if (!map.has(r.orderId)) map.set(r.orderId, r);
  return map;
}

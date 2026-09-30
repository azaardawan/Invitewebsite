import 'server-only';
import { and, desc, eq, ilike, lt, or, type SQL } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { customers, orders } from '@/server/db/schema';
import type { OrderSnapshot } from './receipt';

export type OrderStatus = (typeof orders.$inferSelect)['status'];

export async function listOrders(db: DbOrTx, f: { status?: OrderStatus; q?: string; before?: Date; limit?: number } = {}) {
  const where: SQL[] = [];
  if (f.status) where.push(eq(orders.status, f.status));
  if (f.before) where.push(lt(orders.createdAt, f.before));
  if (f.q) {
    const q = `%${f.q.replace(/[%_\\]/g, '\\$&')}%`;
    where.push(or(ilike(orders.orderNumber, q), ilike(orders.invoiceNumber, q), ilike(customers.phoneE164, q), ilike(customers.name, q))!);
  }
  const rows = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(f.limit ?? 50);
  return rows.map((r) => ({ ...r, snapshot: r.order.snapshot as OrderSnapshot }));
}

/** Shows only the first and last digits unless the viewer may see customer data. */
export function maskPhone(phone: string) {
  return phone.length > 7 ? `${phone.slice(0, 6)}${'•'.repeat(phone.length - 8)}${phone.slice(-2)}` : '••••';
}

export function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  return `${user?.slice(0, 1) ?? ''}•••@${domain ?? ''}`;
}

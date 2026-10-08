import 'server-only';
import { desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { customers, invitations, orders } from '@/server/db/schema';
import type { OrderSnapshot } from '@/server/orders/receipt';
import { accessCodeFor, formatAccessCode, receiptTokenFor } from '@/server/orders/tokens';
import { isLive } from '@/server/orders/payment';

/**
 * Customers in Admin. Each order keeps its own contact row (there are no accounts), so one person is
 * everyone with the same phone number. A customer is opened by the id of any of their rows.
 */
export async function listCustomers(db: DbOrTx, f: { q?: string; limit?: number } = {}) {
  const q = f.q ? `%${f.q.replace(/[%_\\]/g, '\\$&')}%` : null;
  const rows = await db
    .select({
      phone: customers.phoneE164,
      /** The newest row's id, name and email: what the customer gave most recently. */
      id: sql<string>`(array_agg(${customers.id} order by ${customers.createdAt} desc))[1]`,
      name: sql<string>`(array_agg(${customers.name} order by ${customers.createdAt} desc))[1]`,
      email: sql<string>`(array_agg(${customers.email} order by ${customers.createdAt} desc))[1]`,
      orderCount: sql<number>`count(${orders.id})::int`,
      paidIqd: sql<number>`coalesce(sum(${orders.amountIqd}) filter (where ${orders.status} = 'PAID'), 0)::bigint`,
      lastOrderAt: sql<Date>`max(${orders.createdAt})`,
    })
    .from(customers)
    .innerJoin(orders, eq(orders.customerId, customers.id))
    .where(q ? or(ilike(customers.name, q), ilike(customers.phoneE164, q), ilike(customers.email, q)) : undefined)
    .groupBy(customers.phoneE164)
    .orderBy(desc(sql`max(${orders.createdAt})`))
    .limit(f.limit ?? 100);
  return rows.map((r) => ({ ...r, paidIqd: Number(r.paidIqd), lastOrderAt: new Date(r.lastOrderAt) }));
}

/** Everything about one customer (by phone): the names and emails they used, and every order with its invitation. */
export async function customerProfile(db: DbOrTx, customerId: string, now = new Date()) {
  const [first] = await db.select({ phone: customers.phoneE164 }).from(customers).where(eq(customers.id, customerId));
  if (!first) return null;
  const rows = await db
    .select({ order: orders, customer: customers, invitation: invitations })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .innerJoin(invitations, eq(invitations.id, orders.invitationId))
    .where(inArray(orders.customerId, db.select({ id: customers.id }).from(customers).where(eq(customers.phoneE164, first.phone))))
    .orderBy(desc(orders.createdAt));
  if (!rows.length) return null;
  return {
    phone: first.phone,
    name: rows[0]!.customer.name,
    email: rows[0]!.customer.email,
    names: [...new Set(rows.map((r) => r.customer.name))],
    emails: [...new Set(rows.map((r) => r.customer.email))],
    paidIqd: rows.filter((r) => r.order.status === 'PAID').reduce((s, r) => s + r.order.amountIqd, 0),
    orders: rows.map((r) => ({
      id: r.order.id,
      orderNumber: r.order.orderNumber,
      invoiceNumber: r.order.invoiceNumber,
      status: r.order.status,
      amountIqd: r.order.amountIqd,
      createdAt: r.order.createdAt,
      snapshot: r.order.snapshot as OrderSnapshot,
      receiptPath: `/r/${receiptTokenFor(r.order.id)}`,
      accessCode: formatAccessCode(accessCodeFor(r.order.id)),
      invitation: { id: r.invitation.id, status: r.invitation.status, live: isLive(r.invitation, now), expiresAt: r.invitation.expiresAt },
    })),
  };
}

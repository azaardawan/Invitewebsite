import 'server-only';
import { trackEvent } from '@/server/analytics/events';
import { eq, sql } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations, invoiceCounters, orderStatusHistory, orders } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { INVITATION_LIFETIME_DAYS, OrderError } from './common';

/** Next gap-free invoice number for the (Baghdad) year: INV-2026-00001. Must run inside the PAID transaction. */
async function nextInvoiceNumber(tx: DbOrTx, now: Date) {
  const year = new Date(now.getTime() + 3 * 3600_000).getUTCFullYear();
  const [row] = await tx
    .insert(invoiceCounters)
    .values({ year, last: 1 })
    .onConflictDoUpdate({ target: invoiceCounters.year, set: { last: sql`${invoiceCounters.last} + 1` } })
    .returning({ last: invoiceCounters.last });
  return `INV-${year}-${String(row!.last).padStart(5, '0')}`;
}

/** Publishes an invitation for 30 days from now. Idempotent: an already-published invitation keeps its dates. */
export async function publishInvitation(tx: DbOrTx, invitationId: string, now: Date) {
  const [inv] = await tx.select().from(invitations).where(eq(invitations.id, invitationId)).for('update');
  if (!inv) throw new OrderError('notFound');
  if (inv.publishedAt) return { published: false, publishedAt: inv.publishedAt, expiresAt: inv.expiresAt! };
  const expiresAt = new Date(now.getTime() + INVITATION_LIFETIME_DAYS * 86400_000);
  await tx
    .update(invitations)
    .set({ status: 'PUBLISHED', publishedAt: now, expiresAt, previewTokenHash: null, previewExpiresAt: null })
    .where(eq(invitations.id, invitationId));
  return { published: true, publishedAt: now, expiresAt };
}

export type PaymentSource = { kind: 'WAYL' } | { kind: 'MANUAL'; adminId: string; reason: string };

/**
 * Marks an order paid and publishes its invitation, in one transaction.
 * Idempotent and race-safe (row lock): duplicate webhooks, a delayed webhook
 * after a manual publish, or two admins at once all end in one PAID order,
 * one invoice number and one publication.
 */
export async function markOrderPaid(db: DbOrTx, orderId: string, source: PaymentSource, now = new Date()) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');
    if (!order) throw new OrderError('notFound');
    if (order.status === 'PAID') return { alreadyPaid: true, invoiceNumber: order.invoiceNumber! };
    if (order.status === 'REFUNDED') throw new OrderError('refunded');

    const invoiceNumber = await nextInvoiceNumber(tx, now);
    await tx.update(orders).set({ status: 'PAID', paidAt: now, invoiceNumber }).where(eq(orders.id, orderId));
    const actorType = source.kind === 'WAYL' ? 'WEBHOOK' : 'ADMIN';
    const actorAdminId = source.kind === 'MANUAL' ? source.adminId : null;
    const reason = source.kind === 'MANUAL' ? source.reason : null;
    await tx.insert(orderStatusHistory).values({ orderId, fromStatus: order.status, toStatus: 'PAID', actorType, actorAdminId, reason });
    await tx.update(invitations).set({ status: 'PAID' }).where(eq(invitations.id, order.invitationId));
    const pub = await publishInvitation(tx, order.invitationId, now);

    await recordAudit(tx, {
      actorType,
      actorAdminId,
      action: source.kind === 'MANUAL' ? 'order.marked_paid_manually' : 'order.paid',
      objectType: 'order',
      objectId: orderId,
      before: { status: order.status },
      after: { status: 'PAID', invoiceNumber },
      reason,
    });
    if (pub.published) {
      await recordAudit(tx, {
        actorType,
        actorAdminId,
        action: 'invitation.published',
        objectType: 'invitation',
        objectId: order.invitationId,
        after: { publishedAt: pub.publishedAt, expiresAt: pub.expiresAt },
      });
    }
    const [inv] = await tx.select({ themeId: invitations.themeId, packageId: invitations.packageId, locale: invitations.locale }).from(invitations).where(eq(invitations.id, order.invitationId));
    await trackEvent(tx, { name: 'order_paid', locale: inv?.locale, themeId: inv?.themeId, packageId: inv?.packageId, invitationId: order.invitationId, orderId, occurredAt: now });
    return { alreadyPaid: false, invoiceNumber };
  });
}

/** Whether a published invitation is currently visible to guests (expiry is derived, never a stored flag). */
export function isLive(inv: { status: string; expiresAt: Date | null }, now = new Date()) {
  return inv.status === 'PUBLISHED' && inv.expiresAt !== null && inv.expiresAt > now;
}

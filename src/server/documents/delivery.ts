import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { customers, invitations, orders } from '@/server/db/schema';
import { receiptTokenFor } from '@/server/orders/tokens';
import { eventStartIso } from '@/lib/invitation-format';
import { env } from '@/server/env';
import { documentAvailable } from './documents';

type InvitationRow = typeof invitations.$inferSelect;

/**
 * The keepsake reaches the customer once the celebration is over: from the event's start time
 * (or once the invitation has ended, if it has no date). Admin can download it any time.
 */
export function keepsakeReady(inv: Pick<InvitationRow, 'status' | 'featureKeys' | 'publishedAt' | 'fieldValues' | 'expiresAt'>, now = new Date()) {
  if (!documentAvailable(inv, 'keepsake')) return false;
  const starts = eventStartIso(inv.fieldValues.event_date, inv.fieldValues.event_time);
  if (starts) return new Date(starts) <= now;
  return inv.expiresAt !== null && inv.expiresAt <= now;
}

/** The paying customer's phone and private receipt links, for "Send on WhatsApp" in Admin. */
export async function customerDelivery(db: DbOrTx, invitationId: string) {
  const [row] = await db
    .select({ orderId: orders.id, phone: customers.phoneE164, name: customers.name })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(and(eq(orders.invitationId, invitationId), eq(orders.status, 'PAID')))
    .orderBy(desc(orders.paidAt))
    .limit(1);
  if (!row) return null;
  const base = `${env().APP_URL.replace(/\/$/, '')}/r/${receiptTokenFor(row.orderId)}`;
  return { phone: row.phone, name: row.name, receiptUrl: base, cardUrl: `${base}/card`, keepsakeUrl: `${base}/keepsake` };
}

/** wa.me link that opens WhatsApp to the customer with a prepared message. */
export function whatsappLink(phoneE164: string, text: string) {
  return `https://wa.me/${phoneE164.replace(/^\+/, '')}?text=${encodeURIComponent(text)}`;
}

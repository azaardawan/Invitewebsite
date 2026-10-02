import 'server-only';
import { keepsakeReady } from '@/server/documents/delivery';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations, orders } from '@/server/db/schema';
import { invitationPath } from '@/lib/ids';
import { receiptTokenHash } from './tokens';
import { isLive } from './payment';

export type OrderSnapshot = {
  theme: { key: string; name: { ar: string; en: string; ckb?: string | null; bdn?: string | null } };
  themeVersion: { codeRef: string };
  section: { key: string; name: { ar: string; en: string; ckb?: string | null; bdn?: string | null } } | null;
  package: { name: { ar: string; en: string; ckb?: string | null; bdn?: string | null }; priceIqd: number; featureKeys: string[] };
  customer: { name: string; phone: string; email: string };
  invitation: { publicId: string; locale: string; fieldValues: Record<string, string> };
  pricing: { amountIqd: number; currency: 'IQD'; displayUsdRateIqd: number | null };
  createdAt: string;
};

/**
 * Everything the private receipt page shows. Rendered from the order's
 * immutable snapshot, never from current catalog prices. Knowing an order or
 * invoice number grants nothing; only the unguessable token does.
 */
export async function getReceipt(db: DbOrTx, token: string, now = new Date()) {
  if (!token || token.length > 100) return null;
  const [row] = await db
    .select({ order: orders, invitation: invitations })
    .from(orders)
    .innerJoin(invitations, eq(invitations.id, orders.invitationId))
    .where(eq(orders.receiptTokenHash, receiptTokenHash(token)));
  if (!row) return null;
  const snapshot = row.order.snapshot as OrderSnapshot;
  return {
    /** Internal id, for server-side follow-ups (payment checks); never rendered. */
    orderId: row.order.id,
    orderNumber: row.order.orderNumber,
    invoiceNumber: row.order.invoiceNumber,
    status: row.order.status,
    amountIqd: row.order.amountIqd,
    createdAt: row.order.createdAt,
    paidAt: row.order.paidAt,
    snapshot,
    invitation: {
      /** Internal id, for the card download; never rendered. */
      id: row.invitation.id,
      hasPrintCard: row.invitation.featureKeys.includes('print_card'),
      keepsakeReady: keepsakeReady(row.invitation, now),
      hasMessages: row.invitation.featureKeys.includes('congratulations'),
      publicGuestbook: row.invitation.publicGuestbook,
      status: row.invitation.status,
      live: isLive(row.invitation, now),
      publishedAt: row.invitation.publishedAt,
      expiresAt: row.invitation.expiresAt,
      path: row.invitation.publishedAt ? invitationPath(row.invitation.slug, row.invitation.publicId) : null,
    },
  };
}

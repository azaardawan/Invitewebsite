import 'server-only';
import { invitationCardDetails } from '@/server/documents/data';
import { manifestByCodeRef } from '@/theme-registry';
import { selfEditState } from '@/server/invitation/customer-edit';
import { keepsakeReady } from '@/server/documents/delivery';
import { documentAvailable } from '@/server/documents/documents';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { assets, invitations, orders, themes } from '@/server/db/schema';
import { invitationPath } from '@/lib/ids';
import { receiptTokenHash , accessCodeFor, formatAccessCode } from './tokens';
import { isLive } from './payment';
import { publicMediaUrl } from '@/server/storage';

export type OrderSnapshot = {
  theme: { key: string; name: { ar: string; en: string; ckb?: string | null; bdn?: string | null } };
  themeVersion: { codeRef: string };
  section: { key: string; name: { ar: string; en: string; ckb?: string | null; bdn?: string | null } } | null;
  package: { name: { ar: string; en: string; ckb?: string | null; bdn?: string | null }; priceIqd: number; featureKeys: string[] };
  customer: { name: string; phone: string; email: string };
  invitation: { publicId: string; locale: string; fieldValues: Record<string, string> };
  pricing: { amountIqd: number; currency: 'IQD'; displayUsdRateIqd: number | null; listPriceIqd?: number; discountIqd?: number; couponCode?: string | null };
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
    .select({ order: orders, invitation: invitations, coverKey: assets.storageKey })
    .from(orders)
    .innerJoin(invitations, eq(invitations.id, orders.invitationId))
    .innerJoin(themes, eq(themes.id, invitations.themeId))
    .leftJoin(assets, eq(assets.id, themes.coverAssetId))
    .where(eq(orders.receiptTokenHash, receiptTokenHash(token)));
  if (!row) return null;
  const snapshot = row.order.snapshot as OrderSnapshot;
  // Designs without an online invitation (manifest `onlineInvitation: false`) sell files only: no link.
  const onlineInvitation = manifestByCodeRef(snapshot.themeVersion.codeRef)?.onlineInvitation !== false;
  const cardDetails = await invitationCardDetails(db, row.invitation);
  return {
    /** Internal id, for server-side follow-ups (payment checks); never rendered. */
    orderId: row.order.id,
    orderNumber: row.order.orderNumber,
    /** The customer's 10-digit invitation number for the "My invitation" page. */
    accessCode: formatAccessCode(accessCodeFor(row.order.id)),
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
      /** The printed cards the customer gets (`a5` = the card, and/or shapes: leaf, heart…), in order; one file each. */
      cards: cardDetails.map((c) => c.key),
      /** Each shaped card's name in the design's languages (the A5 card has none). */
      cardLabels: Object.fromEntries(cardDetails.filter((c) => c.shape).map((c) => [c.key, c.shape!.label])),
      /** Newborn extras in the package (story, sticker, bottle_label) and the sticker shape chosen. */
      featureKeys: row.invitation.featureKeys,
      stickerShape: row.invitation.stickerShape,
      /** The keepsake can be downloaded as soon as the invitation is live; it grows as guests write. */
      hasKeepsake: documentAvailable(row.invitation, 'keepsake'),
      /** The celebration has started, so the keepsake is (nearly) complete. */
      keepsakeReady: keepsakeReady(row.invitation, now),
      /** The team uploaded its own card: no automatic picture to show. */
      customCard: row.invitation.cardCustomKey !== null,
      cardBack: { title: row.invitation.cardOptions.backTitle ?? '', message: row.invitation.cardOptions.backMessage ?? '' },
      hasMessages: row.invitation.featureKeys.includes('congratulations'),
      publicGuestbook: row.invitation.publicGuestbook,
      hasRsvp: row.invitation.featureKeys.includes('rsvp'),
      publicAttendance: row.invitation.publicAttendance,
      selfEdit: selfEditState(row.invitation, now),
      status: row.invitation.status,
      live: isLive(row.invitation, now),
      publishedAt: row.invitation.publishedAt,
      expiresAt: row.invitation.expiresAt,
      onlineInvitation,
      /** The design's cover picture, for the page's header. */
      coverUrl: row.coverKey ? publicMediaUrl(row.coverKey) : null,
      path: row.invitation.publishedAt && onlineInvitation ? invitationPath(row.invitation.slug, row.invitation.publicId) : null,
    },
  };
}

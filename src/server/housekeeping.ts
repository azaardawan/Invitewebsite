import 'server-only';
import { and, eq, gt, inArray, isNotNull, lt, sql } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { analyticsEvents, documentKind, generatedDocuments, guestResponses, invitations, paymentWebhookEvents } from '@/server/db/schema';
import { WEBHOOK_EVENT_RETENTION_DAYS } from '@/server/payments/service';
import { pruneRateLimits } from '@/server/rate-limit';
import { storage } from '@/server/storage';
import { ensureDocument } from '@/server/documents/documents';
import { deleteOrphanPhotoFiles, deletePhotosOf } from '@/server/photos/photos';
import { deleteCustomSongsOf, deleteOrphanSongFiles } from '@/server/music/custom';
import { deleteOrphanVideoFiles, deleteVideosOf } from '@/server/video/video';
import { deleteOrphanSignatures } from '@/server/media/assets';

/** Guest replies and keepsakes are deleted this long after an invitation ends (privacy policy). */
export const GUEST_DATA_RETENTION_DAYS = 365;
const DAY = 86_400_000;
/** Every watermarked preview kind (collages and posters included), so a new kind is never missed. */
const PREVIEW_KINDS = documentKind.enumValues.filter((k) => k.endsWith('_PREVIEW'));

/**
 * Daily cleanup, safe to run any number of times:
 * - prepares the keepsake of invitations that ended in the last 7 days (so it is ready to download);
 * - deletes guest replies, every generated file (keepsake, cards, collages, posters, link previews) and the customer's
 *   photos, song and video 12 months after an invitation ended (those of orders never paid: 30 days after their
 *   preview link expired);
 * - deletes signature drawings no invitation uses any more;
 * - deletes raw analytics events older than 13 months, and payment webhook deliveries older than 90 days;
 * - deletes the watermarked previews of orders left unpaid for a week;
 * - drops old rate-limit counters.
 */
export async function runHousekeeping(db: DbOrTx, now = new Date(), opts: { prepareKeepsakes?: boolean } = {}) {
  const cutoff = new Date(now.getTime() - GUEST_DATA_RETENTION_DAYS * DAY);

  const old = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(and(isNotNull(invitations.expiresAt), lt(invitations.expiresAt, cutoff)));
  const oldIds = old.map((r) => r.id);

  // Every picture and PDF made for these invitations goes with the personal data: the keepsake (guest messages),
  // and the cards, collages, posters and link previews drawn from the customer's photos and texts.
  // A file still needed later is drawn again on request, from what is left.
  const unpaid = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(and(inArray(invitations.status, ['DRAFT', 'AWAITING_PAYMENT']), lt(invitations.previewExpiresAt, new Date(now.getTime() - 30 * DAY))));
  const personalIds = [...oldIds, ...unpaid.map((r) => r.id)];
  let keepsakesDeleted = 0;
  let documentsDeleted = 0;
  if (personalIds.length) {
    const docs = await db
      .select({ id: generatedDocuments.id, key: generatedDocuments.storageKey, kind: generatedDocuments.kind })
      .from(generatedDocuments)
      .where(inArray(generatedDocuments.invitationId, personalIds));
    for (const d of docs) await storage().delete(d.key).catch(() => {});
    if (docs.length) await db.delete(generatedDocuments).where(inArray(generatedDocuments.id, docs.map((d) => d.id)));
    keepsakesDeleted = docs.filter((d) => d.kind === 'KEEPSAKE_PDF').length;
    documentsDeleted = docs.length;
  }

  let repliesDeleted = 0;
  if (oldIds.length) {
    const gone = await db.delete(guestResponses).where(inArray(guestResponses.invitationId, oldIds)).returning({ id: guestResponses.id });
    repliesDeleted = gone.length;
  }

  // The customer's photos: with the guest data, 12 months after the invitation ended; and those of orders never
  // paid, 30 days after their preview link expired. Then any photo file no invitation uses.
  const photosDeleted = (await deletePhotosOf(db, personalIds)) + (await deleteOrphanPhotoFiles(db, now));
  // The customer's own songs go with them.
  const songsDeleted = (await deleteCustomSongsOf(db, personalIds)) + (await deleteOrphanSongFiles(db, now));
  // And their videos (packages with `video`).
  const videosDeleted = (await deleteVideosOf(db, personalIds)) + (await deleteOrphanVideoFiles(db, now));

  // Signature drawings no invitation uses any more (redrawn or cleared).
  const signaturesDeleted = await deleteOrphanSignatures(db, now);

  // Keepsakes of invitations that just ended: generate once so the customer's download is instant.
  let keepsakesPrepared = 0;
  if (opts.prepareKeepsakes !== false) {
    const ended = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        and(
          eq(invitations.status, 'PUBLISHED'),
          lt(invitations.expiresAt, now),
          gt(invitations.expiresAt, new Date(now.getTime() - 7 * DAY)),
          sql`'keepsake_pdf' = any(${invitations.featureKeys})`,
        ),
      );
    for (const inv of ended) {
      try {
        await ensureDocument(db, inv.id, 'keepsake');
        keepsakesPrepared++;
      } catch (e) {
        console.error(JSON.stringify({ level: 'error', msg: 'housekeeping.keepsake_failed', invitationId: inv.id, error: String(e) }));
      }
    }
  }

  // Payment webhook deliveries are kept 90 days.
  const webhookEvents = await db
    .delete(paymentWebhookEvents)
    .where(lt(paymentWebhookEvents.receivedAt, new Date(now.getTime() - WEBHOOK_EVENT_RETENTION_DAYS * DAY)))
    .returning({ id: paymentWebhookEvents.id });

  // Raw analytics events are kept 13 months.
  const analytics = await db
    .delete(analyticsEvents)
    .where(lt(analyticsEvents.occurredAt, new Date(now.getTime() - 396 * DAY)))
    .returning({ id: analyticsEvents.id });

  // Watermarked preview pictures of orders never paid, a week after their last change.
  const stale = await db
    .select({ id: generatedDocuments.id, key: generatedDocuments.storageKey })
    .from(generatedDocuments)
    .innerJoin(invitations, eq(invitations.id, generatedDocuments.invitationId))
    .where(
      and(
        inArray(invitations.status, ['DRAFT', 'AWAITING_PAYMENT']),
        lt(invitations.updatedAt, new Date(now.getTime() - 7 * DAY)),
        inArray(generatedDocuments.kind, PREVIEW_KINDS),
      ),
    );
  for (const d of stale) await storage().delete(d.key).catch(() => {});
  if (stale.length) await db.delete(generatedDocuments).where(inArray(generatedDocuments.id, stale.map((d) => d.id)));

  await pruneRateLimits(db, now);
  return { repliesDeleted, keepsakesDeleted, documentsDeleted, keepsakesPrepared, analyticsDeleted: analytics.length, previewsDeleted: stale.length, photosDeleted, songsDeleted, videosDeleted, signaturesDeleted, webhookEventsDeleted: webhookEvents.length };
}

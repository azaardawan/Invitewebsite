import 'server-only';
import { and, eq, gt, inArray, isNotNull, lt, sql } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { analyticsEvents, generatedDocuments, guestResponses, invitations } from '@/server/db/schema';
import { pruneRateLimits } from '@/server/rate-limit';
import { storage } from '@/server/storage';
import { ensureDocument } from '@/server/documents/documents';
import { deleteOrphanPhotoFiles, deletePhotosOf } from '@/server/photos/photos';
import { deleteCustomSongsOf, deleteOrphanSongFiles } from '@/server/music/custom';
import { deleteOrphanVideoFiles, deleteVideosOf } from '@/server/video/video';

/** Guest replies and keepsakes are deleted this long after an invitation ends (privacy policy). */
export const GUEST_DATA_RETENTION_DAYS = 365;
const DAY = 86_400_000;

/**
 * Daily cleanup, safe to run any number of times:
 * - prepares the keepsake of invitations that ended in the last 7 days (so it is ready to download);
 * - deletes guest replies, keepsake PDFs and the customer's photos and own song 12 months after an invitation ended
 *   (those of orders never paid: 30 days after their preview link expired);
 * - deletes raw analytics events older than 13 months;
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

  let keepsakesDeleted = 0;
  let repliesDeleted = 0;
  if (oldIds.length) {
    const docs = await db
      .select({ id: generatedDocuments.id, key: generatedDocuments.storageKey, kind: generatedDocuments.kind })
      .from(generatedDocuments)
      // The keepsake and its receipt picture go together.
      .where(and(inArray(generatedDocuments.invitationId, oldIds), inArray(generatedDocuments.kind, ['KEEPSAKE_PDF', 'KEEPSAKE_PREVIEW'])));
    for (const d of docs) await storage().delete(d.key).catch(() => {});
    if (docs.length) await db.delete(generatedDocuments).where(inArray(generatedDocuments.id, docs.map((d) => d.id)));
    keepsakesDeleted = docs.filter((d) => d.kind === 'KEEPSAKE_PDF').length;
    const gone = await db.delete(guestResponses).where(inArray(guestResponses.invitationId, oldIds)).returning({ id: guestResponses.id });
    repliesDeleted = gone.length;
  }

  // The customer's photos: with the guest data, 12 months after the invitation ended; and those of orders never
  // paid, 30 days after their preview link expired. Then any photo file no invitation uses.
  const unpaid = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(and(inArray(invitations.status, ['DRAFT', 'AWAITING_PAYMENT']), lt(invitations.previewExpiresAt, new Date(now.getTime() - 30 * DAY))));
  const photosDeleted = (await deletePhotosOf(db, [...oldIds, ...unpaid.map((r) => r.id)])) + (await deleteOrphanPhotoFiles(db, now));
  // The customer's own songs go with them.
  const songsDeleted = (await deleteCustomSongsOf(db, [...oldIds, ...unpaid.map((r) => r.id)])) + (await deleteOrphanSongFiles(db, now));
  // And their videos (packages with `video`).
  const videosDeleted = (await deleteVideosOf(db, [...oldIds, ...unpaid.map((r) => r.id)])) + (await deleteOrphanVideoFiles(db, now));

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
        inArray(generatedDocuments.kind, ['STORY_PREVIEW', 'STICKER_PREVIEW', 'BOTTLE_PREVIEW', 'CARD_DRAFT_PREVIEW']),
      ),
    );
  for (const d of stale) await storage().delete(d.key).catch(() => {});
  if (stale.length) await db.delete(generatedDocuments).where(inArray(generatedDocuments.id, stale.map((d) => d.id)));

  await pruneRateLimits(db, now);
  return { repliesDeleted, keepsakesDeleted, keepsakesPrepared, analyticsDeleted: analytics.length, previewsDeleted: stale.length, photosDeleted, songsDeleted, videosDeleted };
}

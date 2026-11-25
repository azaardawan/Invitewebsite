import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, eq, inArray, isNotNull, like, lt, notInArray, or } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { assets, invitationVideos, invitations, themeVersions } from '@/server/db/schema';
import type { ThemeManifest } from '@/theme-sdk/manifest';
import { publicMediaUrl, storage } from '@/server/storage';
import { sha256Buffer } from '@/lib/crypto';
import { processVideo } from '@/server/media/video';

type InvitationRow = typeof invitations.$inferSelect;

export class VideoError extends Error {
  constructor(public readonly code: 'notIncluded' | 'notFound' | 'noSuchPlace') {
    super(code);
  }
}

/** Where customers' videos (and their stills) are stored: their own folder, never shared or reused. */
const VIDEO_PREFIX = 'videos/';

/** Whether the customer may add their own video (the package has `video`). */
export function videoIncluded(inv: Pick<InvitationRow, 'featureKeys'>) {
  return inv.featureKeys.includes('video');
}

export type CustomerVideo = { src: string; poster: string; width: number; height: number; durationSeconds: number };

/**
 * How many videos the customer may add: none without `video`; else the design's screens (manifest `videos.max`, one
 * without it), at most the package's `video_limit` (copied onto the invitation).
 */
export function videoPlaces(inv: Pick<InvitationRow, 'featureKeys' | 'videoLimit'>, manifest: Pick<ThemeManifest, 'videos'> | null | undefined) {
  if (!videoIncluded(inv)) return 0;
  const max = manifest?.videos?.max ?? 1;
  return Math.max(1, Math.min(max, inv.videoLimit ?? max));
}

/** The same, reading the invitation's design version. */
export async function videoPlacesOf(db: DbOrTx, inv: Pick<InvitationRow, 'featureKeys' | 'videoLimit' | 'themeVersionId'>) {
  if (!videoIncluded(inv)) return 0;
  const [v] = await db.select({ manifest: themeVersions.manifest }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
  return videoPlaces(inv, v?.manifest as ThemeManifest | undefined);
}

function toVideo(v: typeof assets.$inferSelect, p: typeof assets.$inferSelect): CustomerVideo {
  return { src: publicMediaUrl(v.storageKey), poster: publicMediaUrl(p.storageKey), width: v.width ?? 0, height: v.height ?? 0, durationSeconds: v.durationSeconds ?? 0 };
}

/** Every video place of the invitation (`places` of them), in order: the customer's video there, or null. */
export async function customerVideos(
  db: DbOrTx,
  inv: Pick<InvitationRow, 'id' | 'videoAssetId' | 'videoPosterAssetId' | 'featureKeys'>,
  places: number,
): Promise<(CustomerVideo | null)[]> {
  if (!places || !videoIncluded(inv)) return [];
  const more = places > 1 ? await db.select().from(invitationVideos).where(eq(invitationVideos.invitationId, inv.id)) : [];
  const pairs: [number, string | null, string | null][] = [[0, inv.videoAssetId, inv.videoPosterAssetId], ...more.map((m): [number, string, string] => [m.place, m.videoAssetId, m.posterAssetId])];
  const ids = pairs.flatMap(([, v, p]) => [v, p]).filter((x): x is string => !!x);
  const rows = ids.length ? await db.select().from(assets).where(inArray(assets.id, ids)) : [];
  return Array.from({ length: places }, (_, place) => {
    const pair = pairs.find(([at]) => at === place);
    const v = rows.find((r) => r.id === pair?.[1]);
    const p = rows.find((r) => r.id === pair?.[2]);
    return v && p ? toVideo(v, p) : null;
  });
}

/** The customer's video, or null. */
export async function customerVideo(db: DbOrTx, inv: Pick<InvitationRow, 'videoAssetId' | 'videoPosterAssetId' | 'featureKeys'>): Promise<CustomerVideo | null> {
  if (!inv.videoAssetId || !inv.videoPosterAssetId || !videoIncluded(inv)) return null;
  const rows = await db.select().from(assets).where(inArray(assets.id, [inv.videoAssetId, inv.videoPosterAssetId]));
  const v = rows.find((r) => r.id === inv.videoAssetId);
  const p = rows.find((r) => r.id === inv.videoPosterAssetId);
  if (!v || !p) return null;
  return { src: publicMediaUrl(v.storageKey), poster: publicMediaUrl(p.storageKey), width: v.width ?? 0, height: v.height ?? 0, durationSeconds: v.durationSeconds ?? 0 };
}

/** Removes video files and their records (after no invitation points at them). */
export async function deleteVideoFiles(db: DbOrTx, ids: (string | null)[]) {
  const list = ids.filter((x): x is string => !!x);
  if (!list.length) return;
  const rows = await db.select({ id: assets.id, key: assets.storageKey }).from(assets).where(inArray(assets.id, list));
  await db.delete(assets).where(inArray(assets.id, list));
  for (const r of rows) await storage().delete(r.key).catch(() => {});
}

/**
 * Makes the customer's file (on disk) their page's video at `place` (0 = the first; designs with several screens have
 * more): converted and cut to a minute (processVideo), replacing the one they added there before. MediaError for a file
 * that isn't a usable video, in which case nothing is stored.
 */
export async function setVideo(db: DbOrTx, inv: InvitationRow, file: string, workDir: string, place = 0): Promise<CustomerVideo> {
  if (!videoIncluded(inv)) throw new VideoError('notIncluded');
  if (!Number.isInteger(place) || place < 0 || place >= (await videoPlacesOf(db, inv))) throw new VideoError('noSuchPlace');
  const out = await processVideo(file, workDir);
  const id = randomUUID();
  const videoKey = `${VIDEO_PREFIX}${id}.mp4`;
  const posterKey = `${VIDEO_PREFIX}${id}.jpg`;
  await storage().put(videoKey, out.video.data, out.video.mime);
  await storage().put(posterKey, out.poster.data, out.poster.mime);
  const [video] = await db
    .insert(assets)
    .values({ kind: 'VIDEO', storageKey: videoKey, mime: out.video.mime, bytes: out.video.data.byteLength, width: out.video.width, height: out.video.height, durationSeconds: out.video.durationSeconds, sha256: sha256Buffer(out.video.data), originalFilename: 'video', uploadedBy: null })
    .returning();
  const [poster] = await db
    .insert(assets)
    .values({ kind: 'IMAGE', storageKey: posterKey, mime: out.poster.mime, bytes: out.poster.data.byteLength, width: out.poster.width, height: out.poster.height, sha256: sha256Buffer(out.poster.data), originalFilename: 'video-poster', uploadedBy: null })
    .returning();
  if (place > 0) {
    const [before] = await db.select().from(invitationVideos).where(and(eq(invitationVideos.invitationId, inv.id), eq(invitationVideos.place, place)));
    const [row] = await db
      .insert(invitationVideos)
      .values({ invitationId: inv.id, place, videoAssetId: video!.id, posterAssetId: poster!.id })
      .onConflictDoUpdate({ target: [invitationVideos.invitationId, invitationVideos.place], set: { videoAssetId: video!.id, posterAssetId: poster!.id, createdAt: new Date() } })
      .returning({ place: invitationVideos.place })
      .catch(() => []);
    if (!row) {
      await deleteVideoFiles(db, [video!.id, poster!.id]);
      throw new VideoError('notFound');
    }
    await db.update(invitations).set({ updatedAt: new Date() }).where(eq(invitations.id, inv.id));
    if (before) await deleteVideoFiles(db, [before.videoAssetId, before.posterAssetId]);
    return toVideo(video!, poster!);
  }
  const [current] = await db.select({ v: invitations.videoAssetId, p: invitations.videoPosterAssetId }).from(invitations).where(eq(invitations.id, inv.id));
  const [updated] = await db
    .update(invitations)
    .set({ videoAssetId: video!.id, videoPosterAssetId: poster!.id, updatedAt: new Date() })
    .where(eq(invitations.id, inv.id))
    .returning({ id: invitations.id });
  if (!updated) {
    await deleteVideoFiles(db, [video!.id, poster!.id]);
    throw new VideoError('notFound');
  }
  await deleteVideoFiles(db, [current?.v ?? null, current?.p ?? null]);
  return { src: publicMediaUrl(videoKey), poster: publicMediaUrl(posterKey), width: out.video.width, height: out.video.height, durationSeconds: out.video.durationSeconds };
}

/** Takes the customer's video at `place` away (its files are deleted). Returns whether there was one. */
export async function removeVideo(db: DbOrTx, invitationId: string, place = 0) {
  if (place > 0) {
    const [gone] = await db.delete(invitationVideos).where(and(eq(invitationVideos.invitationId, invitationId), eq(invitationVideos.place, place))).returning();
    if (!gone) return false;
    await deleteVideoFiles(db, [gone.videoAssetId, gone.posterAssetId]);
    return true;
  }
  const [inv] = await db.select({ v: invitations.videoAssetId, p: invitations.videoPosterAssetId }).from(invitations).where(eq(invitations.id, invitationId));
  if (!inv?.v && !inv?.p) return false;
  await db.update(invitations).set({ videoAssetId: null, videoPosterAssetId: null, updatedAt: new Date() }).where(eq(invitations.id, invitationId));
  await deleteVideoFiles(db, [inv.v, inv.p]);
  return true;
}

/** Deletes the videos of these invitations (privacy retention, with the photos). Returns how many went. */
export async function deleteVideosOf(db: DbOrTx, invitationIds: string[]) {
  if (!invitationIds.length) return 0;
  const more = await db.delete(invitationVideos).where(inArray(invitationVideos.invitationId, invitationIds)).returning();
  await deleteVideoFiles(db, more.flatMap((m) => [m.videoAssetId, m.posterAssetId]));
  const rows = await db
    .select({ id: invitations.id, v: invitations.videoAssetId, p: invitations.videoPosterAssetId })
    .from(invitations)
    .where(and(inArray(invitations.id, invitationIds), or(isNotNull(invitations.videoAssetId), isNotNull(invitations.videoPosterAssetId))));
  if (rows.length) {
    await db.update(invitations).set({ videoAssetId: null, videoPosterAssetId: null }).where(inArray(invitations.id, rows.map((r) => r.id)));
    await deleteVideoFiles(db, rows.flatMap((r) => [r.v, r.p]));
  }
  return new Set([...rows.map((r) => r.id), ...more.map((m) => m.invitationId)]).size;
}

/** Video files no invitation uses any more; only files older than an hour, so an upload in progress is never touched. */
export async function deleteOrphanVideoFiles(db: DbOrTx, now = new Date()) {
  const used = db
    .select({ id: invitations.videoAssetId })
    .from(invitations)
    .where(isNotNull(invitations.videoAssetId))
    .union(db.select({ id: invitations.videoPosterAssetId }).from(invitations).where(isNotNull(invitations.videoPosterAssetId)))
    .union(db.select({ id: invitationVideos.videoAssetId }).from(invitationVideos))
    .union(db.select({ id: invitationVideos.posterAssetId }).from(invitationVideos))
    // The couples' opening films (src/server/film/film.ts) are stored with the videos too.
    .union(db.select({ id: invitations.filmAssetId }).from(invitations).where(isNotNull(invitations.filmAssetId)));
  const orphans = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(like(assets.storageKey, `${VIDEO_PREFIX}%`), notInArray(assets.id, used), lt(assets.createdAt, new Date(now.getTime() - 3600_000))));
  await deleteVideoFiles(db, orphans.map((o) => o.id));
  return orphans.length;
}

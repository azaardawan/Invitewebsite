import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, eq, inArray, isNotNull, like, lt, notInArray } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { assets, invitations } from '@/server/db/schema';
import { publicMediaUrl, storage } from '@/server/storage';
import { sha256Buffer } from '@/lib/crypto';
import { processSong } from '@/server/media/song';

type InvitationRow = typeof invitations.$inferSelect;

export class CustomMusicError extends Error {
  constructor(public readonly code: 'notIncluded' | 'notFound') {
    super(code);
  }
}

/** Where customers' songs are stored: their own folder, so nothing else shares or reuses them. */
const SONG_PREFIX = 'songs/';

/** Whether the customer may add their own song to this invitation (its package has `custom_music`). */
export function customMusicIncluded(inv: Pick<InvitationRow, 'featureKeys'>) {
  return inv.featureKeys.includes('custom_music') && inv.featureKeys.includes('music');
}

export type CustomSong = { src: string; durationSeconds: number };

/** The customer's own song, or null (the design's song plays). */
export async function customSong(db: DbOrTx, inv: Pick<InvitationRow, 'customMusicAssetId' | 'featureKeys'>): Promise<CustomSong | null> {
  if (!inv.customMusicAssetId || !customMusicIncluded(inv)) return null;
  const [a] = await db.select({ key: assets.storageKey, duration: assets.durationSeconds }).from(assets).where(eq(assets.id, inv.customMusicAssetId));
  return a ? { src: publicMediaUrl(a.key), durationSeconds: a.duration ?? 0 } : null;
}

/** Removes song files and their records (after no invitation points at them). */
export async function deleteSongFiles(db: DbOrTx, ids: string[]) {
  if (!ids.length) return;
  const rows = await db.select({ id: assets.id, key: assets.storageKey }).from(assets).where(inArray(assets.id, ids));
  await db.delete(assets).where(inArray(assets.id, ids));
  for (const r of rows) await storage().delete(r.key).catch(() => {});
}

/**
 * Makes the customer's file (audio or video, on disk) their invitation's song: converted and cut to 2 minutes from
 * `start` (see processSong), replacing any song they added before. MediaError for a file without usable sound, in
 * which case nothing is stored.
 */
export async function setCustomSong(db: DbOrTx, inv: InvitationRow, file: string, start = 0): Promise<CustomSong> {
  if (!customMusicIncluded(inv)) throw new CustomMusicError('notIncluded');
  const song = await processSong(file, start);
  const key = `${SONG_PREFIX}${randomUUID()}.mp3`;
  await storage().put(key, song.data, song.mime);
  const [asset] = await db
    .insert(assets)
    .values({ kind: 'AUDIO', storageKey: key, mime: song.mime, bytes: song.data.byteLength, durationSeconds: song.durationSeconds, sha256: sha256Buffer(song.data), originalFilename: 'song', uploadedBy: null })
    .returning();
  const [before] = await db
    .update(invitations)
    .set({ customMusicAssetId: asset!.id, updatedAt: new Date() })
    .where(eq(invitations.id, inv.id))
    .returning({ id: invitations.id });
  if (!before) {
    await deleteSongFiles(db, [asset!.id]);
    throw new CustomMusicError('notFound');
  }
  if (inv.customMusicAssetId) await deleteSongFiles(db, [inv.customMusicAssetId]);
  return { src: publicMediaUrl(key), durationSeconds: song.durationSeconds };
}

/** Takes the customer's song away (its file is deleted): the design's song plays again. Returns whether there was one. */
export async function removeCustomSong(db: DbOrTx, invitationId: string) {
  const [inv] = await db.select({ assetId: invitations.customMusicAssetId }).from(invitations).where(eq(invitations.id, invitationId));
  if (!inv?.assetId) return false;
  await db.update(invitations).set({ customMusicAssetId: null, updatedAt: new Date() }).where(eq(invitations.id, invitationId));
  await deleteSongFiles(db, [inv.assetId]);
  return true;
}

/** Deletes the songs of these invitations (privacy retention, with the photos and guest data). Returns how many went. */
export async function deleteCustomSongsOf(db: DbOrTx, invitationIds: string[]) {
  if (!invitationIds.length) return 0;
  const rows = await db
    .select({ id: invitations.id, assetId: invitations.customMusicAssetId })
    .from(invitations)
    .where(and(inArray(invitations.id, invitationIds), isNotNull(invitations.customMusicAssetId)));
  if (!rows.length) return 0;
  await db.update(invitations).set({ customMusicAssetId: null }).where(inArray(invitations.id, rows.map((r) => r.id)));
  await deleteSongFiles(db, rows.map((r) => r.assetId!));
  return rows.length;
}

/**
 * Song files no invitation uses any more (replaced, removed, an unfinished upload or a deleted invitation). Only files
 * older than an hour, so an upload in progress is never touched.
 */
export async function deleteOrphanSongFiles(db: DbOrTx, now = new Date()) {
  const used = db.select({ id: invitations.customMusicAssetId }).from(invitations).where(isNotNull(invitations.customMusicAssetId));
  const orphans = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(like(assets.storageKey, `${SONG_PREFIX}%`), notInArray(assets.id, used), lt(assets.createdAt, new Date(now.getTime() - 3600_000))));
  await deleteSongFiles(db, orphans.map((o) => o.id));
  return orphans.length;
}

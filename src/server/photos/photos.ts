import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, asc, eq, gt, inArray, like, lt, notInArray } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { assets, invitationPhotos, invitations, themeVersions } from '@/server/db/schema';
import { storage, publicMediaUrl } from '@/server/storage';
import { sha256Buffer } from '@/lib/crypto';
import { normalizeCoverFocus, type CoverFocus } from '@/lib/cover-focus';
import { manifestByCodeRef } from '@/theme-registry';
import { DEFAULT_PHOTO_ASPECT, type PhotoSpec, type ThemeManifest } from '@/theme-sdk/manifest';
import { processPhoto } from '@/server/media/process';
import { collagePhotoCount } from '@/catalog/collages';

type InvitationRow = typeof invitations.$inferSelect;

export class PhotoError extends Error {
  constructor(public readonly code: 'notIncluded' | 'position' | 'notFound' | 'locked') {
    super(code);
  }
}

/** Where customer photo files are stored: their own folder, so nothing else ever shares or reuses them. */
const PHOTO_PREFIX = 'photos/';

/**
 * The photo places of an invitation: the design's (its version's manifest, packages with `photos`), and as many as the
 * package's largest collage holds (src/catalog/collages.ts), whichever is more; null when there are none. Places past
 * the design's own take the collages' frame (4:5) and no name.
 */
export async function photoSpec(
  db: DbOrTx,
  inv: Pick<InvitationRow, 'themeVersionId' | 'featureKeys'>,
): Promise<(Required<Pick<PhotoSpec, 'max' | 'min' | 'aspect'>> & Pick<PhotoSpec, 'labels'> & { aspects: number[] }) | null> {
  const collage = collagePhotoCount(inv.featureKeys);
  let spec: PhotoSpec | undefined;
  if (inv.featureKeys.includes('photos')) {
    const [v] = await db.select({ codeRef: themeVersions.codeRef, manifest: themeVersions.manifest }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
    spec = (v?.manifest as ThemeManifest | null)?.photos ?? (v ? manifestByCodeRef(v.codeRef)?.photos : undefined);
  }
  if (!spec && !collage) return null;
  const own = spec?.max ?? 0;
  const max = Math.max(own, collage);
  const aspect = spec?.aspect ?? (spec ? DEFAULT_PHOTO_ASPECT : COLLAGE_PHOTO_ASPECT);
  // Each place's frame: its own (a collage design), the design's common one, or the collages' past the design's places.
  const aspects = Array.from({ length: max }, (_, i) => (i < own ? (spec?.frames?.[i]?.aspect ?? aspect) : COLLAGE_PHOTO_ASPECT));
  return { max, min: spec?.min ?? 0, aspect, labels: spec?.labels, aspects };
}

/** The frame photos past the design's own places are shown in on the order form (the collages crop each to its place). */
const COLLAGE_PHOTO_ASPECT = 0.8;

export type InvitationPhoto = {
  position: number;
  /** The online invitation's size. */
  src: string;
  /** The full size, for printing. */
  fullSrc: string;
  width: number;
  height: number;
  focus: CoverFocus;
};

/** An invitation's photos in the design's order. */
export async function listPhotos(db: DbOrTx, invitationId: string): Promise<InvitationPhoto[]> {
  const rows = await db
    .select({ photo: invitationPhotos, display: assets })
    .from(invitationPhotos)
    .innerJoin(assets, eq(assets.id, invitationPhotos.displayAssetId))
    .where(eq(invitationPhotos.invitationId, invitationId))
    .orderBy(asc(invitationPhotos.position));
  if (!rows.length) return [];
  const fulls = await db.select({ id: assets.id, storageKey: assets.storageKey }).from(assets).where(inArray(assets.id, rows.map((r) => r.photo.assetId)));
  return rows.map((r) => ({
    position: r.photo.position,
    src: publicMediaUrl(r.display.storageKey),
    fullSrc: publicMediaUrl(fulls.find((f) => f.id === r.photo.assetId)!.storageKey),
    width: r.display.width ?? 0,
    height: r.display.height ?? 0,
    focus: normalizeCoverFocus(r.photo.focus),
  }));
}

async function storeOne(db: DbOrTx, img: { data: Buffer; width: number; height: number }) {
  const key = `${PHOTO_PREFIX}${randomUUID()}.webp`;
  await storage().put(key, img.data, 'image/webp');
  const [row] = await db
    .insert(assets)
    .values({ kind: 'IMAGE', storageKey: key, mime: 'image/webp', bytes: img.data.byteLength, width: img.width, height: img.height, sha256: sha256Buffer(img.data), originalFilename: 'photo', uploadedBy: null })
    .returning();
  return row!;
}

/** Removes photo files and their records (after their photo rows are gone). */
export async function deletePhotoFiles(db: DbOrTx, ids: string[]) {
  if (!ids.length) return;
  const rows = await db.select({ id: assets.id, key: assets.storageKey }).from(assets).where(inArray(assets.id, ids));
  await db.delete(assets).where(inArray(assets.id, ids));
  for (const r of rows) await storage().delete(r.key).catch(() => {});
}

/**
 * Puts a photo in a place (0 = the first), replacing the one there. The file is checked and re-encoded first
 * (MediaError for a bad file), so nothing is stored for a refused upload. Starts centred in the frame.
 */
export async function setPhoto(db: DbOrTx, inv: InvitationRow, position: number, input: Buffer) {
  const spec = await photoSpec(db, inv);
  if (!spec) throw new PhotoError('notIncluded');
  if (!Number.isInteger(position) || position < 0 || position >= spec.max) throw new PhotoError('position');
  // Photos fill the places in order: a new one goes in the next free place (at most), never leaving a gap.
  const count = (await listPhotos(db, inv.id)).length;
  if (position > count) position = count;
  if (position >= spec.max) throw new PhotoError('position');
  const img = await processPhoto(input);
  const full = await storeOne(db, img.full);
  const display = await storeOne(db, img.display);
  const old = await db.transaction(async (tx) => {
    const [prev] = await tx
      .select()
      .from(invitationPhotos)
      .where(and(eq(invitationPhotos.invitationId, inv.id), eq(invitationPhotos.position, position)))
      .for('update');
    if (prev) await tx.delete(invitationPhotos).where(eq(invitationPhotos.id, prev.id));
    await tx.insert(invitationPhotos).values({ invitationId: inv.id, position, assetId: full.id, displayAssetId: display.id });
    return prev;
  });
  if (old) await deletePhotoFiles(db, [old.assetId, old.displayAssetId]);
  return (await listPhotos(db, inv.id)).find((p) => p.position === position)!;
}

/** Where a photo sits in its frame (moved and zoomed by the customer). */
export async function setPhotoFocus(db: DbOrTx, invitationId: string, position: number, focus: Partial<CoverFocus>) {
  const [row] = await db
    .update(invitationPhotos)
    .set({ focus: normalizeCoverFocus(focus) })
    .where(and(eq(invitationPhotos.invitationId, invitationId), eq(invitationPhotos.position, position)))
    .returning();
  if (!row) throw new PhotoError('notFound');
  return normalizeCoverFocus(row.focus);
}

/** Takes a photo away (its files are deleted); the photos after it move up a place, so there is never a gap. */
export async function removePhoto(db: DbOrTx, invitationId: string, position: number) {
  const row = await db.transaction(async (tx) => {
    const [gone] = await tx
      .delete(invitationPhotos)
      .where(and(eq(invitationPhotos.invitationId, invitationId), eq(invitationPhotos.position, position)))
      .returning();
    if (!gone) throw new PhotoError('notFound');
    await closeGap(tx, invitationId, position);
    return gone;
  });
  await deletePhotoFiles(db, [row.assetId, row.displayAssetId]);
}

/** Moves every photo after `position` up one place (one by one, in order, so places stay unique). */
export async function closeGap(tx: DbOrTx, invitationId: string, position: number) {
  const later = await tx
    .select({ id: invitationPhotos.id, position: invitationPhotos.position })
    .from(invitationPhotos)
    .where(and(eq(invitationPhotos.invitationId, invitationId), gt(invitationPhotos.position, position)))
    .orderBy(asc(invitationPhotos.position));
  for (const p of later) await tx.update(invitationPhotos).set({ position: p.position - 1 }).where(eq(invitationPhotos.id, p.id));
}

/** Swaps two photos' places (to put the right photo in the right spot of a collage); each keeps its placement. */
export async function swapPhotos(db: DbOrTx, invitationId: string, a: number, b: number) {
  if (a === b) return;
  await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(invitationPhotos)
      .where(and(eq(invitationPhotos.invitationId, invitationId), inArray(invitationPhotos.position, [a, b])))
      .for('update');
    const pa = rows.find((r) => r.position === a);
    const pb = rows.find((r) => r.position === b);
    if (!pa || !pb) throw new PhotoError('notFound');
    await tx.update(invitationPhotos).set({ position: -1 }).where(eq(invitationPhotos.id, pa.id));
    await tx.update(invitationPhotos).set({ position: a }).where(eq(invitationPhotos.id, pb.id));
    await tx.update(invitationPhotos).set({ position: b }).where(eq(invitationPhotos.id, pa.id));
  });
}

/** Deletes every photo of these invitations (privacy retention). Returns how many photos went. */
export async function deletePhotosOf(db: DbOrTx, invitationIds: string[]) {
  if (!invitationIds.length) return 0;
  const rows = await db.delete(invitationPhotos).where(inArray(invitationPhotos.invitationId, invitationIds)).returning();
  await deletePhotoFiles(db, rows.flatMap((r) => [r.assetId, r.displayAssetId]));
  return rows.length;
}

/**
 * Photo files no invitation uses any more (an unfinished upload, or an invitation that was deleted, whose photo
 * rows went with it). Only files older than an hour, so an upload in progress is never touched.
 */
export async function deleteOrphanPhotoFiles(db: DbOrTx, now = new Date()) {
  const used = db.select({ id: invitationPhotos.assetId }).from(invitationPhotos).union(db.select({ id: invitationPhotos.displayAssetId }).from(invitationPhotos));
  const orphans = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(like(assets.storageKey, `${PHOTO_PREFIX}%`), notInArray(assets.id, used), lt(assets.createdAt, new Date(now.getTime() - 3600_000))));
  await deletePhotoFiles(db, orphans.map((o) => o.id));
  return orphans.length;
}

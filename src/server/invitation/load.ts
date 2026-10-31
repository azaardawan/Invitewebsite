import 'server-only';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { assets, guestResponses, invitations, musicTracks, sections, themeVersions } from '@/server/db/schema';
import { publicMediaUrl } from '@/server/storage';
import type { InvitationMode } from '@/theme-sdk/types';
import { themeBorder } from '@/server/catalog/border';
import { buildThemeProps } from './theme-props';
import { attendanceCounts } from '@/server/guests/attendance';
import { listPhotos } from '@/server/photos/photos';
import { customSong } from '@/server/music/custom';
import { customerVideo } from '@/server/video/video';
import type { ThemeManifest } from '@/theme-sdk/manifest';
import type { SignatureStrokes } from '@/lib/signature-strokes';

type InvitationRow = typeof invitations.$inferSelect;

/**
 * What the renderer needs for a stored invitation: its exact theme version and contract props. `drawSignatures`:
 * the signatures come with how they were drawn, so the design draws them again (the online invitation and its
 * preview only; pictures and print always show them finished).
 */
export async function invitationRenderData(db: DbOrTx, inv: InvitationRow, mode: InvitationMode, opts: { drawSignatures?: boolean } = {}) {
  const [version] = await db.select({ codeRef: themeVersions.codeRef, manifest: themeVersions.manifest }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
  const [music] = inv.musicTrackId
    ? await db
        .select({ key: assets.storageKey })
        .from(musicTracks)
        .innerJoin(assets, eq(assets.id, musicTracks.assetId))
        .where(eq(musicTracks.id, inv.musicTrackId))
    : [];
  // The customer's own song (packages with `custom_music`) replaces the design's.
  const own = await customSong(db, inv);
  return {
    codeRef: version!.codeRef,
    props: buildThemeProps({
      mode,
      locale: inv.locale,
      fieldKeys: inv.fieldKeys,
      features: inv.featureKeys,
      values: inv.fieldValues,
      musicSrc: own?.src ?? (music ? publicMediaUrl(music.key) : null),
      border: await themeBorder(db, inv.themeId),
      guestbook: mode === 'live' && inv.publicGuestbook && inv.featureKeys.includes('congratulations') ? await publicGuestbook(db, inv.id) : null,
      attendance: mode === 'live' && inv.publicAttendance && inv.featureKeys.includes('rsvp') ? await attendanceCounts(db, inv.id) : null,
      signatureSrcs: await signatureUrls(db, inv),
      signatureStrokes: opts.drawSignatures ? signatureStrokesOf(inv) : undefined,
      colorSlots: (version!.manifest as ThemeManifest).colors?.slots ?? [],
      colors: inv.colors,
      occasion: await occasionKey(db, inv.sectionId),
      birthDateFormat: { style: inv.birthDateStyle, digits: inv.birthDateDigits },
      wordingLines: (version!.manifest as ThemeManifest).wording ?? [],
      wording: inv.wording,
      switchDefs: (version!.manifest as ThemeManifest).switches ?? [],
      switches: inv.switches,
      photos: inv.featureKeys.includes('photos') ? await listPhotos(db, inv.id) : [],
      photoSpec: limitedPhotoSpec((version!.manifest as ThemeManifest).photos ?? null, inv.photoLimit),
      video: await customerVideo(db, inv),
    }),
  };
}

/** The design's photo settings with the package's limit applied (the package may sell fewer photos). */
function limitedPhotoSpec(spec: ThemeManifest['photos'] | null, limit: number | null) {
  return spec && limit != null ? { ...spec, max: Math.min(spec.max, limit) } : spec;
}

/** The section key of the occasion an invitation is for (e.g. `wedding`), or null. */
export async function occasionKey(db: DbOrTx, sectionId: string | null) {
  if (!sectionId) return null;
  const [s] = await db.select({ key: sections.key }).from(sections).where(eq(sections.id, sectionId));
  return s?.key ?? null;
}

/** Visible guest messages for the public list under the invitation, newest first (hidden ones never appear). */
export async function publicGuestbook(db: DbOrTx, invitationId: string) {
  const rows = await db
    .select({ guestName: guestResponses.guestName, message: guestResponses.message })
    .from(guestResponses)
    .where(and(eq(guestResponses.invitationId, invitationId), eq(guestResponses.messageStatus, 'VISIBLE'), isNotNull(guestResponses.message)))
    .orderBy(desc(guestResponses.createdAt), desc(guestResponses.id))
    .limit(500);
  return rows.map((r) => ({ guestName: r.guestName, message: r.message! }));
}


/** How each present signature was drawn, in the same order as signatureUrls (null when not recorded). */
export function signatureStrokesOf(inv: Pick<InvitationRow, 'signatureAssetId' | 'signature2AssetId' | 'signatureStrokes' | 'signature2Strokes'>) {
  return [inv.signatureAssetId ? (inv.signatureStrokes ?? null) : undefined, inv.signature2AssetId ? (inv.signature2Strokes ?? null) : undefined].filter(
    (s): s is SignatureStrokes | null => s !== undefined,
  );
}

/** Public URLs of an invitation's signature images, first then second (missing ones left out). */
export async function signatureUrls(db: DbOrTx, inv: Pick<InvitationRow, 'signatureAssetId' | 'signature2AssetId'>) {
  const urls = [await signatureUrl(db, inv.signatureAssetId), await signatureUrl(db, inv.signature2AssetId)];
  return urls.filter((u): u is string => Boolean(u));
}

/** Public URL of a customer's signature image, or null. */
export async function signatureUrl(db: DbOrTx, assetId: string | null) {
  if (!assetId) return null;
  const [a] = await db.select({ key: assets.storageKey }).from(assets).where(eq(assets.id, assetId));
  return a ? publicMediaUrl(a.key) : null;
}

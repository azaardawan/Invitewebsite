import 'server-only';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { assets, guestResponses, invitations, musicTracks, sections, themeVersions } from '@/server/db/schema';
import { publicMediaUrl } from '@/server/storage';
import type { InvitationMode } from '@/theme-sdk/types';
import { themeBorder } from '@/server/catalog/border';
import { buildThemeProps } from './theme-props';
import { attendanceCounts } from '@/server/guests/attendance';
import type { ThemeManifest } from '@/theme-sdk/manifest';

type InvitationRow = typeof invitations.$inferSelect;

/** What the renderer needs for a stored invitation: its exact theme version and contract props. */
export async function invitationRenderData(db: DbOrTx, inv: InvitationRow, mode: InvitationMode) {
  const [version] = await db.select({ codeRef: themeVersions.codeRef, manifest: themeVersions.manifest }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
  const [music] = inv.musicTrackId
    ? await db
        .select({ key: assets.storageKey })
        .from(musicTracks)
        .innerJoin(assets, eq(assets.id, musicTracks.assetId))
        .where(eq(musicTracks.id, inv.musicTrackId))
    : [];
  return {
    codeRef: version!.codeRef,
    props: buildThemeProps({
      mode,
      locale: inv.locale,
      fieldKeys: inv.fieldKeys,
      features: inv.featureKeys,
      values: inv.fieldValues,
      musicSrc: music ? publicMediaUrl(music.key) : null,
      border: await themeBorder(db, inv.themeId),
      guestbook: mode === 'live' && inv.publicGuestbook && inv.featureKeys.includes('congratulations') ? await publicGuestbook(db, inv.id) : null,
      attendance: mode === 'live' && inv.publicAttendance && inv.featureKeys.includes('rsvp') ? await attendanceCounts(db, inv.id) : null,
      signatureSrcs: await signatureUrls(db, inv),
      colorSlots: (version!.manifest as ThemeManifest).colors?.slots ?? [],
      colors: inv.colors,
      occasion: await occasionKey(db, inv.sectionId),
    }),
  };
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

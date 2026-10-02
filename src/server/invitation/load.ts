import 'server-only';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { assets, guestResponses, invitations, musicTracks, themeVersions } from '@/server/db/schema';
import { publicMediaUrl } from '@/server/storage';
import type { InvitationMode } from '@/theme-sdk/types';
import { buildThemeProps } from './theme-props';

type InvitationRow = typeof invitations.$inferSelect;

/** What the renderer needs for a stored invitation: its exact theme version and contract props. */
export async function invitationRenderData(db: DbOrTx, inv: InvitationRow, mode: InvitationMode) {
  const [version] = await db.select({ codeRef: themeVersions.codeRef }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
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
      guestbook: mode === 'live' && inv.publicGuestbook && inv.featureKeys.includes('congratulations') ? await publicGuestbook(db, inv.id) : null,
    }),
  };
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


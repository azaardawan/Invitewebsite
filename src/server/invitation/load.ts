import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { assets, invitations, musicTracks, themeVersions } from '@/server/db/schema';
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
    }),
  };
}

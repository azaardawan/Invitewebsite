import 'server-only';
import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { assets, invitations, themes } from '@/server/db/schema';
import { invitationPath, publicIdFromSlugPath } from '@/lib/ids';
import { isLive } from '@/server/orders/payment';
import { publicMediaUrl } from '@/server/storage';

export type PublicInvitation =
  | { state: 'missing' }
  | { state: 'redirect'; to: string }
  | { state: 'ended'; locale: string }
  | { state: 'live'; invitation: typeof invitations.$inferSelect; canonicalPath: string; coverUrl: string | null };

/**
 * Resolves `/i/<slug>-<id>` (or `/i/<id>`). The id is authoritative; any other
 * slug redirects to the canonical URL, so renaming never breaks shared links.
 * Never-published invitations look exactly like missing ones.
 */
export const resolvePublicInvitation = cache(async (segment: string): Promise<PublicInvitation> => {
  const publicId = publicIdFromSlugPath(decodeURIComponent(segment).toLowerCase());
  if (!publicId) return { state: 'missing' };
  const [row] = await db()
    .select({ inv: invitations, coverKey: assets.storageKey })
    .from(invitations)
    .innerJoin(themes, eq(themes.id, invitations.themeId))
    .leftJoin(assets, eq(assets.id, themes.coverAssetId))
    .where(eq(invitations.publicId, publicId));
  if (!row || !row.inv.publishedAt) return { state: 'missing' };
  const canonicalPath = invitationPath(row.inv.slug, row.inv.publicId);
  if (`/i/${segment}` !== canonicalPath) return { state: 'redirect', to: canonicalPath };
  if (!isLive(row.inv)) return { state: 'ended', locale: row.inv.locale };
  return { state: 'live', invitation: row.inv, canonicalPath, coverUrl: row.coverKey ? publicMediaUrl(row.coverKey) : null };
});

import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations, themeVersions } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { consumeRateLimit } from '@/server/rate-limit';
import { PREVIEW_TTL_MS } from '@/server/orders/common';
import { MediaError } from '@/server/media/process';
import { PHOTO_UPLOAD_MAX_BYTES } from '@/server/photos/http';
import { listPhotos, POSTER_PHOTO_PLACE, PhotoError, removePhoto, setPhotoFocus, setPosterPhoto } from '@/server/photos/photos';
import { cleanPosterChoices, OWN_PICTURE } from '@/lib/poster-choices';
import { hasPosters, includedPosters, type PosterOrientation } from '@/catalog/posters';
import type { ThemeManifest } from '@/theme-sdk/manifest';

type InvitationRow = typeof invitations.$inferSelect;

/** Saves per visitor per hour: one per picture chosen or text written. */
const SAVES_PER_HOUR = 300;
/** Pictures uploaded for the posters per visitor per hour. */
const UPLOADS_PER_HOUR = 30;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });

async function posterTexts(db: DbOrTx, inv: InvitationRow) {
  const [v] = await db.select({ manifest: themeVersions.manifest }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
  return (v?.manifest as ThemeManifest | undefined)?.posters?.texts ?? [];
}

/** After a change: keeps the preview link open before checkout; audits a change after publishing. */
async function afterChange(db: DbOrTx, inv: InvitationRow, published: boolean, after: Record<string, unknown>) {
  if (published) {
    await recordAudit(db, { actorType: 'CUSTOMER', actorAdminId: null, action: 'invitation.posters_changed', objectType: 'invitation', objectId: inv.id, after });
  } else {
    await db.update(invitations).set({ previewExpiresAt: new Date(Date.now() + PREVIEW_TTL_MS) }).where(eq(invitations.id, inv.id));
  }
}

/**
 * The poster step: PATCH `{ landscape?: { main?, row?, texts? }, portrait?: … }` replaces those posters' choices (see
 * poster-choices.ts) and answers `{ posterChoices }`. Only the posters the package sells, and only the design's texts
 * for each. The posters' pictures are drawn again the next time they are asked for.
 */
export async function handlePosterRequest(db: DbOrTx, req: Request, inv: InvitationRow | null, ctx: { ipHash: string | null; published: boolean }) {
  if (!inv) return json({ error: 'notFound' }, 404);
  if (!hasPosters(inv.featureKeys)) return json({ error: 'notIncluded' }, 400);
  if (req.method !== 'PATCH') return json({ error: 'method' }, 405);
  if (ctx.ipHash && !(await consumeRateLimit(db, `posters:ip:${ctx.ipHash}`, SAVES_PER_HOUR, 3600))) return json({ error: 'rateLimited' }, 429);
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const sold = includedPosters(inv.featureKeys);
  if (body && Object.keys(body).some((o) => !sold.includes(o as PosterOrientation))) return json({ error: 'notIncluded' }, 400);
  const defs = await posterTexts(db, inv);
  const allowed = Object.fromEntries(sold.map((o) => [o, Object.fromEntries(defs.filter((d) => d.on.includes(o)).map((d) => [d.key, d.maxLength]))]));
  const own = (await listPhotos(db, inv.id, { posters: true })).map((p) => (p.position === POSTER_PHOTO_PLACE.landscape ? 'landscape' : 'portrait') as PosterOrientation);
  const choices = cleanPosterChoices(body, (await listPhotos(db, inv.id)).map((p) => p.position), { texts: allowed, own });
  if (!choices) return json({ error: 'invalid' }, 400);
  const posterChoices = { ...inv.posterChoices, ...choices };
  await db.update(invitations).set({ posterChoices }).where(eq(invitations.id, inv.id));
  await afterChange(db, inv, ctx.published, { posters: Object.keys(choices) });
  return json({ posterChoices });
}

/**
 * A picture for one poster only (`orientation`): POST a file (multipart `file`) to upload it (it becomes that poster's
 * big picture), PATCH `{ x, y, zoom }` to place it in the poster's frame, DELETE to take it away (the poster goes back to
 * the video's still or the first photo).
 */
export async function handlePosterPhotoRequest(db: DbOrTx, req: Request, inv: InvitationRow | null, orientation: string, ctx: { ipHash: string | null; published: boolean }) {
  if (!inv) return json({ error: 'notFound' }, 404);
  if (orientation !== 'landscape' && orientation !== 'portrait') return json({ error: 'notFound' }, 404);
  if (!includedPosters(inv.featureKeys).includes(orientation)) return json({ error: 'notIncluded' }, 400);
  const place = POSTER_PHOTO_PLACE[orientation];
  try {
    if (req.method === 'POST') {
      if (ctx.ipHash && !(await consumeRateLimit(db, `poster-photos:ip:${ctx.ipHash}`, UPLOADS_PER_HOUR, 3600))) return json({ error: 'rateLimited' }, 429);
      if (Number(req.headers.get('content-length') ?? 0) > PHOTO_UPLOAD_MAX_BYTES + 64 * 1024) return json({ error: 'tooLarge' }, 413);
      const file = (await req.formData().catch(() => null))?.get('file');
      if (!(file instanceof File)) return json({ error: 'unsupportedImage' }, 400);
      if (file.size > PHOTO_UPLOAD_MAX_BYTES) return json({ error: 'tooLarge' }, 413);
      const photo = await setPosterPhoto(db, inv, orientation, Buffer.from(await file.arrayBuffer()));
      // The uploaded picture becomes that poster's big picture.
      const posterChoices = { ...inv.posterChoices, [orientation]: { ...inv.posterChoices[orientation], main: OWN_PICTURE } };
      await db.update(invitations).set({ posterChoices }).where(eq(invitations.id, inv.id));
      await afterChange(db, inv, ctx.published, { posterPhoto: orientation });
      return json({ photo, posterChoices });
    }
    if (req.method === 'PATCH') {
      const body = (await req.json().catch(() => null)) as { x?: unknown; y?: unknown; zoom?: unknown } | null;
      const num = (v: unknown) => (typeof v === 'number' ? v : undefined);
      return json({ focus: await setPhotoFocus(db, inv.id, place, { x: num(body?.x), y: num(body?.y), zoom: num(body?.zoom) }) });
    }
    if (req.method === 'DELETE') {
      await removePhoto(db, inv.id, place);
      const { main: _main, ...rest } = inv.posterChoices[orientation] ?? {};
      void _main;
      const posterChoices = { ...inv.posterChoices, [orientation]: rest };
      await db.update(invitations).set({ posterChoices }).where(eq(invitations.id, inv.id));
      await afterChange(db, inv, ctx.published, { posterPhotoRemoved: orientation });
      return json({ posterChoices });
    }
    return json({ error: 'method' }, 405);
  } catch (e) {
    if (e instanceof MediaError) return json({ error: e.code }, 400);
    if (e instanceof PhotoError) return json({ error: e.code }, e.code === 'notFound' ? 404 : 400);
    throw e;
  }
}

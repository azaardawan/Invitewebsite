import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { consumeRateLimit } from '@/server/rate-limit';
import { PREVIEW_TTL_MS } from '@/server/orders/common';
import { listPhotos } from '@/server/photos/photos';
import { cleanPosterChoices } from '@/lib/poster-choices';

type InvitationRow = typeof invitations.$inferSelect;

/** Saves per visitor per hour: one per picture chosen. */
const SAVES_PER_HOUR = 200;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });

/**
 * The poster step: PATCH `{ landscape?: { main?, row? }, portrait?: { main? } }` replaces those posters' choices (see
 * choices.ts) and answers `{ posterChoices }`. Before checkout it keeps the preview link open; after publishing it is
 * audited. The posters' pictures are drawn again the next time they are asked for.
 */
export async function handlePosterRequest(db: DbOrTx, req: Request, inv: InvitationRow | null, ctx: { ipHash: string | null; published: boolean }) {
  if (!inv) return json({ error: 'notFound' }, 404);
  if (!inv.featureKeys.includes('couple_poster')) return json({ error: 'notIncluded' }, 400);
  if (req.method !== 'PATCH') return json({ error: 'method' }, 405);
  if (ctx.ipHash && !(await consumeRateLimit(db, `posters:ip:${ctx.ipHash}`, SAVES_PER_HOUR, 3600))) return json({ error: 'rateLimited' }, 429);
  const body = await req.json().catch(() => null);
  const choices = cleanPosterChoices(body, (await listPhotos(db, inv.id)).map((p) => p.position));
  if (!choices) return json({ error: 'invalid' }, 400);
  const posterChoices = { ...inv.posterChoices, ...choices };
  await db
    .update(invitations)
    .set({ posterChoices, ...(ctx.published ? {} : { previewExpiresAt: new Date(Date.now() + PREVIEW_TTL_MS) }) })
    .where(eq(invitations.id, inv.id));
  if (ctx.published) {
    await recordAudit(db, { actorType: 'CUSTOMER', actorAdminId: null, action: 'invitation.posters_changed', objectType: 'invitation', objectId: inv.id, after: { posterChoices } });
  }
  return json({ posterChoices });
}

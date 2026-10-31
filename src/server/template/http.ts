import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { consumeRateLimit } from '@/server/rate-limit';
import { PREVIEW_TTL_MS } from '@/server/orders/common';
import { PhotoError } from '@/server/photos/photos';
import { setTemplateText, TemplateTextError } from './text';

type InvitationRow = typeof invitations.$inferSelect;

/** Saves per visitor per hour: one per text the customer finishes typing. */
const SAVES_PER_HOUR = 300;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });

/**
 * The template editor's texts: PATCH `{ key, value }` saves one (see setTemplateText) and answers `{ value }`, what the
 * design now shows. Before checkout it also keeps the preview link open; after publishing it is audited (the key only).
 */
export async function handleTemplateTextRequest(db: DbOrTx, req: Request, inv: InvitationRow | null, ctx: { ipHash: string | null; published: boolean }) {
  if (!inv) return json({ error: 'notFound' }, 404);
  if (req.method !== 'PATCH') return json({ error: 'method' }, 405);
  if (ctx.ipHash && !(await consumeRateLimit(db, `template-text:ip:${ctx.ipHash}`, SAVES_PER_HOUR, 3600))) return json({ error: 'rateLimited' }, 429);
  const body = (await req.json().catch(() => null)) as { key?: unknown; value?: unknown } | null;
  if (typeof body?.key !== 'string' || typeof body.value !== 'string') return json({ error: 'invalid' }, 400);
  try {
    const value = await setTemplateText(db, inv, body.key, body.value);
    if (ctx.published) {
      await recordAudit(db, { actorType: 'CUSTOMER', actorAdminId: null, action: 'invitation.text_changed', objectType: 'invitation', objectId: inv.id, after: { key: body.key } });
    } else {
      await db.update(invitations).set({ previewExpiresAt: new Date(Date.now() + PREVIEW_TTL_MS) }).where(eq(invitations.id, inv.id));
    }
    return json({ value });
  } catch (e) {
    if (e instanceof TemplateTextError) return json({ error: e.code }, 400);
    if (e instanceof PhotoError) return json({ error: e.code }, e.code === 'notFound' ? 404 : 400);
    throw e;
  }
}

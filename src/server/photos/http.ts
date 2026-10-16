import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations, orders } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { consumeRateLimit } from '@/server/rate-limit';
import { MediaError } from '@/server/media/process';
import { findByPreviewToken } from '@/server/orders/drafts';
import { receiptTokenHash } from '@/server/orders/tokens';
import { selfEditState } from '@/server/invitation/customer-edit';
import { PhotoError, removePhoto, setPhoto, setPhotoFocus } from './photos';

type InvitationRow = typeof invitations.$inferSelect;

/** Uploads per visitor per hour (each is a few seconds of image work); enough for a 20-photo design and some changes. */
const UPLOADS_PER_HOUR = 80;
/** The browser shrinks photos before sending; this only stops absurd uploads. */
export const PHOTO_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;

/** The draft behind a preview link, while it can still be changed (before checkout). */
export async function draftForPhotos(db: DbOrTx, previewToken: string) {
  const inv = await findByPreviewToken(db, previewToken);
  return inv && inv.status === 'DRAFT' ? inv : null;
}

/** The published invitation behind a receipt, when its package lets the customer change it (`self_edit`). */
export async function publishedForPhotos(db: DbOrTx, receiptToken: string) {
  if (!receiptToken || receiptToken.length > 100) return null;
  const [row] = await db
    .select({ order: orders, inv: invitations })
    .from(orders)
    .innerJoin(invitations, eq(invitations.id, orders.invitationId))
    .where(eq(orders.receiptTokenHash, receiptTokenHash(receiptToken)));
  if (!row || row.order.status !== 'PAID' || !selfEditState(row.inv).allowed) return null;
  return row.inv;
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });

/**
 * One photo place of an invitation: POST a file (multipart `file`) to put a photo there, PATCH `{ x, y, zoom }` to
 * move it in its frame, DELETE to take it away. `published`: a change after publishing, recorded in the audit log.
 */
export async function handlePhotoRequest(db: DbOrTx, req: Request, inv: InvitationRow | null, positionParam: string, ctx: { ipHash: string | null; published: boolean }) {
  if (!inv) return json({ error: 'notFound' }, 404);
  const position = Number(positionParam);
  if (!/^\d{1,2}$/.test(positionParam)) return json({ error: 'position' }, 400);
  try {
    if (req.method === 'POST') {
      if (ctx.ipHash && !(await consumeRateLimit(db, `photos:ip:${ctx.ipHash}`, UPLOADS_PER_HOUR, 3600))) return json({ error: 'rateLimited' }, 429);
      const length = Number(req.headers.get('content-length') ?? 0);
      if (length > PHOTO_UPLOAD_MAX_BYTES + 64 * 1024) return json({ error: 'tooLarge' }, 413);
      const form = await req.formData().catch(() => null);
      const file = form?.get('file');
      if (!(file instanceof File)) return json({ error: 'unsupportedImage' }, 400);
      if (file.size > PHOTO_UPLOAD_MAX_BYTES) return json({ error: 'tooLarge' }, 413);
      const photo = await setPhoto(db, inv, position, Buffer.from(await file.arrayBuffer()));
      if (ctx.published) await audit(db, inv.id, 'photo.replaced', position);
      return json({ photo });
    }
    if (req.method === 'PATCH') {
      const body = (await req.json().catch(() => null)) as { x?: unknown; y?: unknown; zoom?: unknown } | null;
      const num = (v: unknown) => (typeof v === 'number' ? v : undefined);
      const focus = await setPhotoFocus(db, inv.id, position, { x: num(body?.x), y: num(body?.y), zoom: num(body?.zoom) });
      return json({ focus });
    }
    if (req.method === 'DELETE') {
      await removePhoto(db, inv.id, position);
      if (ctx.published) await audit(db, inv.id, 'photo.removed', position);
      return json({ ok: true });
    }
    return json({ error: 'method' }, 405);
  } catch (e) {
    if (e instanceof MediaError) return json({ error: e.code }, 400);
    if (e instanceof PhotoError) return json({ error: e.code }, e.code === 'notFound' ? 404 : 400);
    throw e;
  }
}

async function audit(db: DbOrTx, invitationId: string, action: string, position: number) {
  await recordAudit(db, { actorType: 'CUSTOMER', actorAdminId: null, action, objectType: 'invitation', objectId: invitationId, after: { position } });
}

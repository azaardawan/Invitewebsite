import 'server-only';
import { createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import type { DbOrTx } from '@/server/db/client';
import type { invitations } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { consumeRateLimit } from '@/server/rate-limit';
import { MediaError } from '@/server/media/process';
import { VIDEO_UPLOAD_MAX_BYTES } from '@/server/media/video';
import { VideoError, removeVideo, setVideo, videoIncluded } from './video';

type InvitationRow = typeof invitations.$inferSelect;

/** Videos per visitor per hour (each is up to a minute of conversion). */
const UPLOADS_PER_HOUR = 10;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });

class TooLarge extends Error {}

/**
 * The customer's own video: POST the file itself as the body to set it (replacing the one before), DELETE to take it
 * away. The body goes straight to a private temporary folder (never held in memory), deleted afterwards. Audited.
 */
export async function handleVideoRequest(db: DbOrTx, req: Request, inv: InvitationRow | null, ctx: { ipHash: string | null; published: boolean }) {
  if (!inv) return json({ error: 'notFound' }, 404);
  if (!videoIncluded(inv)) return json({ error: 'notIncluded' }, 400);
  try {
    if (req.method === 'POST') {
      if (ctx.ipHash && !(await consumeRateLimit(db, `videos:ip:${ctx.ipHash}`, UPLOADS_PER_HOUR, 3600))) return json({ error: 'rateLimited' }, 429);
      if (Number(req.headers.get('content-length') ?? 0) > VIDEO_UPLOAD_MAX_BYTES) return json({ error: 'tooLarge' }, 413);
      if (!req.body) return json({ error: 'unsupportedVideo' }, 400);
      const dir = await mkdtemp(path.join(tmpdir(), 'bahja-video-'));
      try {
        const file = path.join(dir, 'upload');
        let bytes = 0;
        const limit = new Transform({
          transform(chunk: Buffer, _enc, done) {
            bytes += chunk.byteLength;
            done(bytes > VIDEO_UPLOAD_MAX_BYTES ? new TooLarge() : null, chunk);
          },
        });
        await pipeline(Readable.fromWeb(req.body as WebReadableStream<Uint8Array>), limit, createWriteStream(file));
        if (bytes === 0) return json({ error: 'unsupportedVideo' }, 400);
        const video = await setVideo(db, inv, file, dir);
        await audit(db, inv.id, ctx.ipHash, 'video.set', { durationSeconds: video.durationSeconds, published: ctx.published });
        return json({ video });
      } catch (e) {
        if (e instanceof TooLarge) return json({ error: 'tooLarge' }, 413);
        throw e;
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    }
    if (req.method === 'DELETE') {
      if (await removeVideo(db, inv.id)) await audit(db, inv.id, ctx.ipHash, 'video.removed', { published: ctx.published });
      return json({ ok: true });
    }
    return json({ error: 'method' }, 405);
  } catch (e) {
    if (e instanceof MediaError) return json({ error: e.code }, 400);
    if (e instanceof VideoError) return json({ error: e.code }, e.code === 'notFound' ? 404 : 400);
    throw e;
  }
}

async function audit(db: DbOrTx, invitationId: string, ipHash: string | null, action: string, after: Record<string, unknown>) {
  await recordAudit(db, { actorType: 'CUSTOMER', actorAdminId: null, action, objectType: 'invitation', objectId: invitationId, after, ipHash });
}

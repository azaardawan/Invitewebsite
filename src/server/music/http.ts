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
import { SONG_UPLOAD_MAX_BYTES } from '@/server/media/song';
import { CustomMusicError, customMusicIncluded, removeCustomSong, setCustomSong } from './custom';

type InvitationRow = typeof invitations.$inferSelect;

/** Songs per visitor per hour (each is a few seconds of conversion); plenty for trying a few. */
const UPLOADS_PER_HOUR = 20;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });

class TooLarge extends Error {}

/**
 * The customer's own song for an invitation: POST the file itself as the body (audio or video, any type; `?start=`
 * seconds to begin from, `confirm=1` that they may use it) to set it, DELETE to go back to the design's song. The
 * body is written straight to a temporary file (never held in memory) and deleted afterwards. Every change is audited
 * (the customer's confirmation is the record that they took responsibility for the song).
 */
export async function handleSongRequest(db: DbOrTx, req: Request, inv: InvitationRow | null, ctx: { ipHash: string | null; published: boolean }) {
  if (!inv) return json({ error: 'notFound' }, 404);
  if (!customMusicIncluded(inv)) return json({ error: 'notIncluded' }, 400);
  try {
    if (req.method === 'POST') {
      if (ctx.ipHash && !(await consumeRateLimit(db, `songs:ip:${ctx.ipHash}`, UPLOADS_PER_HOUR, 3600))) return json({ error: 'rateLimited' }, 429);
      if (Number(req.headers.get('content-length') ?? 0) > SONG_UPLOAD_MAX_BYTES) return json({ error: 'tooLarge' }, 413);
      if (!req.body) return json({ error: 'unsupportedAudio' }, 400);
      const query = new URL(req.url).searchParams;
      // The customer must confirm they may use the song (Terms); the confirmation is kept in the audit log.
      if (query.get('confirm') !== '1') return json({ error: 'confirm' }, 400);
      const start = Number(query.get('start') ?? 0);
      const dir = await mkdtemp(path.join(tmpdir(), 'bahja-song-'));
      try {
        const file = path.join(dir, 'upload');
        let bytes = 0;
        const limit = new Transform({
          transform(chunk: Buffer, _enc, done) {
            bytes += chunk.byteLength;
            done(bytes > SONG_UPLOAD_MAX_BYTES ? new TooLarge() : null, chunk);
          },
        });
        await pipeline(Readable.fromWeb(req.body as WebReadableStream<Uint8Array>), limit, createWriteStream(file));
        if (bytes === 0) return json({ error: 'unsupportedAudio' }, 400);
        const song = await setCustomSong(db, inv, file, start);
        await audit(db, inv.id, ctx.ipHash, 'music.custom_set', { rightsConfirmed: true, start: Math.max(0, Math.round(start) || 0), published: ctx.published });
        return json({ song });
      } catch (e) {
        if (e instanceof TooLarge) return json({ error: 'tooLarge' }, 413);
        throw e;
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    }
    if (req.method === 'DELETE') {
      if (await removeCustomSong(db, inv.id)) {
        await audit(db, inv.id, ctx.ipHash, 'music.custom_removed', { published: ctx.published });
      }
      return json({ ok: true });
    }
    return json({ error: 'method' }, 405);
  } catch (e) {
    if (e instanceof MediaError) return json({ error: e.code }, 400);
    if (e instanceof CustomMusicError) return json({ error: e.code }, e.code === 'notFound' ? 404 : 400);
    throw e;
  }
}

async function audit(db: DbOrTx, invitationId: string, ipHash: string | null, action: string, after: Record<string, unknown>) {
  await recordAudit(db, { actorType: 'CUSTOMER', actorAdminId: null, action, objectType: 'invitation', objectId: invitationId, after, ipHash });
}

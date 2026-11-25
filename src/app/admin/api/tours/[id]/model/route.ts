import { createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/server/db/client';
import { getCurrentAdmin } from '@/server/auth/current';
import { nextAuthStep } from '@/server/auth/session';
import { isSameOrigin } from '@/server/auth/same-origin';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { can } from '@/server/rbac/authz';
import { CatalogError } from '@/server/catalog/common';
import { setTourModel, TOUR_MODEL_MAX_BYTES } from '@/server/tours/tours';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

class TooLarge extends Error {}

/**
 * A virtual tour's 3D model (.glb): POST the file itself as the body. It goes straight to a private temporary folder
 * (never held whole in memory while arriving), is checked to be a glTF binary, then stored and audited.
 */
export async function POST(req: NextRequest, ctx: RouteContext<'/admin/api/tours/[id]/model'>) {
  if (!isSameOrigin(req.headers)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const current = await getCurrentAdmin();
  if (!current || nextAuthStep(current.user, current.session) !== 'ok') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!can(current.authz, 'tours.manage')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'notFound' }, { status: 404 });
  if (Number(req.headers.get('content-length') ?? 0) > TOUR_MODEL_MAX_BYTES) return NextResponse.json({ error: 'tooLarge' }, { status: 413 });
  if (!req.body) return NextResponse.json({ error: 'notGlb' }, { status: 400 });
  const dir = await mkdtemp(path.join(tmpdir(), 'bahja-tour-'));
  try {
    const file = path.join(dir, 'model.glb');
    let bytes = 0;
    const limit = new Transform({
      transform(chunk: Buffer, _enc, done) {
        bytes += chunk.byteLength;
        done(bytes > TOUR_MODEL_MAX_BYTES ? new TooLarge() : null, chunk);
      },
    });
    await pipeline(Readable.fromWeb(req.body as WebReadableStream<Uint8Array>), limit, createWriteStream(file));
    const name = req.headers.get('x-file-name') ?? undefined;
    await setTourModel(db(), id, file, { adminId: current.user.id, ipHash: hashIp(clientIpFrom(req.headers)) }, name ? decodeURIComponent(name) : undefined);
    return NextResponse.json({ ok: true, bytes });
  } catch (e) {
    if (e instanceof TooLarge) return NextResponse.json({ error: 'tooLarge' }, { status: 413 });
    if (e instanceof CatalogError) return NextResponse.json({ error: e.code }, { status: e.code === 'notFound' ? 404 : 400 });
    throw e;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

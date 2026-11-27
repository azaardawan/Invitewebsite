import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { consumeRateLimit } from '@/server/rate-limit';
import { getReceipt } from '@/server/orders/receipt';
import { boardNotes } from '@/server/board/data';
import { saveBoardArrangement } from '@/server/board/service';
import { renderBoard } from '@/server/documents/render';
import { MAX_BOARDS } from '@/catalog/signature-board';

export const dynamic = 'force-dynamic';

/** Saves while the couple drag messages around: generous, but not unlimited. */
const SAVES_PER_HOUR = 1200;
/** Each file is a few seconds of Chromium. */
const DOWNLOADS_PER_HOUR = 20;

const noStore = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' };

async function boardFor(token: string) {
  const r = await getReceipt(db(), token);
  return r && r.invitation.signatureBoard ? r : null;
}

/** The couple's arrangement of their signature board, from the receipt's editor. */
export async function PUT(req: Request, { params }: RouteContext<'/r/[token]/board'>) {
  const { token } = await params;
  const r = await boardFor(token);
  if (!r) return Response.json({ error: 'notFound' }, { status: 404, headers: noStore });
  const ipHash = hashIp(clientIpFrom(await headers()));
  if (ipHash && !(await consumeRateLimit(db(), `board:save:${ipHash}`, SAVES_PER_HOUR, 3600))) return Response.json({ error: 'rateLimited' }, { status: 429, headers: noStore });
  const ids = new Set((await boardNotes(db(), r.invitation.id)).map((n) => n.id));
  const ok = await saveBoardArrangement(db(), r.invitation.id, await req.text(), ids);
  return Response.json(ok ? { ok: true } : { error: 'invalid' }, { status: ok ? 200 : 400, headers: noStore });
}

/** The boards as files, once paid: `?format=pdf` every board (a page each), `?format=png&n=1` one board as a picture. */
export async function GET(req: Request, { params }: RouteContext<'/r/[token]/board'>) {
  const { token } = await params;
  const r = await boardFor(token);
  if (!r || r.status !== 'PAID') return new Response('Not found', { status: 404 });
  const ipHash = hashIp(clientIpFrom(await headers()));
  if (ipHash && !(await consumeRateLimit(db(), `board:file:${ipHash}`, DOWNLOADS_PER_HOUR, 3600))) {
    return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '3600' } });
  }
  const url = new URL(req.url);
  const format = url.searchParams.get('format') === 'png' ? 'png' : 'pdf';
  const n = Math.max(0, Math.min(MAX_BOARDS - 1, Number(url.searchParams.get('n')) || 0));
  const { file } = await renderBoard(r.invitation.id, format, n);
  const name = format === 'pdf' ? `signature-board-${r.snapshot.invitation.publicId}.pdf` : `signature-board-${r.snapshot.invitation.publicId}-${n + 1}.png`;
  return new Response(new Uint8Array(file), {
    headers: {
      ...noStore,
      'Content-Type': format === 'pdf' ? 'application/pdf' : 'image/png',
      'Content-Disposition': `${url.searchParams.get('inline') === '1' ? 'inline' : 'attachment'}; filename="${name}"`,
    },
  });
}

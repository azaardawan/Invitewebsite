import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { consumeRateLimit } from '@/server/rate-limit';
import { getReceipt } from '@/server/orders/receipt';
import { DocumentError, ensurePreview } from '@/server/documents/documents';

/** A stored picture is cheap, but a fresh one costs Chromium; cap it per visitor. */
const PREVIEWS_PER_HOUR = 60;

/** The card's front or back, or the keepsake cover, as a picture for the receipt's previews. */
export async function GET(_req: Request, { params }: RouteContext<'/r/[token]/preview/[kind]'>) {
  const { token, kind } = await params;
  if (kind !== 'card' && kind !== 'cardBack' && kind !== 'keepsake') return new Response('Not found', { status: 404 });
  const r = await getReceipt(db(), token);
  const offered = kind === 'keepsake' ? r?.invitation.hasKeepsake : r?.invitation.hasPrintCard;
  if (!r || r.status !== 'PAID' || !offered) return new Response('Not found', { status: 404 });
  const ipHash = hashIp(clientIpFrom(await headers()));
  if (ipHash && !(await consumeRateLimit(db(), `preview:ip:${ipHash}`, PREVIEWS_PER_HOUR, 3600))) {
    return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '3600' } });
  }
  try {
    const image = await ensurePreview(db(), r.invitation.id, kind);
    if (!image) return new Response('Not found', { status: 404 });
    return new Response(new Uint8Array(image), {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' },
    });
  } catch (e) {
    if (e instanceof DocumentError) return new Response('Not found', { status: 404 });
    throw e;
  }
}

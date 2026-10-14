import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { consumeRateLimit } from '@/server/rate-limit';
import { getReceipt } from '@/server/orders/receipt';
import { DocumentError, shapeCardPng } from '@/server/documents/documents';

/** Each picture costs a few seconds of Chromium; cap it per visitor (as the card PDF). */
const DOWNLOADS_PER_HOUR = 20;

/** One side of the customer's shaped card (leaf, heart…) as a transparent PNG, after payment. */
export async function GET(_req: Request, { params }: RouteContext<'/r/[token]/card-png/[side]'>) {
  const { token, side } = await params;
  if (side !== 'front' && side !== 'back') return new Response('Not found', { status: 404 });
  const r = await getReceipt(db(), token);
  if (!r || r.status !== 'PAID' || !r.invitation.hasPrintCard || !r.invitation.cardShape) return new Response('Not found', { status: 404 });
  const ipHash = hashIp(clientIpFrom(await headers()));
  if (ipHash && !(await consumeRateLimit(db(), `card-png:ip:${ipHash}`, DOWNLOADS_PER_HOUR, 3600))) {
    return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '3600' } });
  }
  try {
    const file = await shapeCardPng(db(), r.invitation.id, side);
    if (!file) return new Response('Not found', { status: 404 });
    return new Response(new Uint8Array(file.png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (e) {
    if (e instanceof DocumentError) return new Response('Not found', { status: 404 });
    throw e;
  }
}

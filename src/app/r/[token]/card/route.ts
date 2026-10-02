import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { consumeRateLimit } from '@/server/rate-limit';
import { getReceipt } from '@/server/orders/receipt';
import { DocumentError, ensureDocument } from '@/server/documents/documents';
import { trackEvent } from '@/server/analytics/events';

/** Rendering a PDF costs a few seconds of Chromium; cap it per visitor. */
const DOWNLOADS_PER_HOUR = 20;

/** The customer's printable card, reachable only through their private receipt token, after payment. */
export async function GET(_req: Request, { params }: RouteContext<'/r/[token]/card'>) {
  const { token } = await params;
  const r = await getReceipt(db(), token);
  if (!r || r.status !== 'PAID' || !r.invitation.hasPrintCard) return new Response('Not found', { status: 404 });
  const ipHash = hashIp(clientIpFrom(await headers()));
  if (ipHash && !(await consumeRateLimit(db(), `card:ip:${ipHash}`, DOWNLOADS_PER_HOUR, 3600))) {
    return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '3600' } });
  }
  try {
    const { pdf, fileName } = await ensureDocument(db(), r.invitation.id, 'card');
    await trackEvent(db(), { name: 'card_download', invitationId: r.invitation.id, orderId: r.orderId });
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (e) {
    if (e instanceof DocumentError) return new Response('Not found', { status: 404 });
    throw e;
  }
}

import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { consumeRateLimit } from '@/server/rate-limit';
import { getReceipt } from '@/server/orders/receipt';
import { DocumentError, ensureDocument } from '@/server/documents/documents';

/** Rendering a PDF costs a few seconds of Chromium; cap it per visitor. */
const DOWNLOADS_PER_HOUR = 20;

/** The customer's keepsake of guest messages, through their private receipt token, once the celebration is over. */
export async function GET(_req: Request, { params }: RouteContext<'/r/[token]/keepsake'>) {
  const { token } = await params;
  const r = await getReceipt(db(), token);
  if (!r || r.status !== 'PAID' || !r.invitation.keepsakeReady) return new Response('Not found', { status: 404 });
  const ipHash = hashIp(clientIpFrom(await headers()));
  if (ipHash && !(await consumeRateLimit(db(), `keepsake:ip:${ipHash}`, DOWNLOADS_PER_HOUR, 3600))) {
    return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '3600' } });
  }
  try {
    const { pdf, fileName } = await ensureDocument(db(), r.invitation.id, 'keepsake');
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

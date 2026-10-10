import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { consumeRateLimit } from '@/server/rate-limit';
import { getReceipt } from '@/server/orders/receipt';
import { ProductError, ensureProductFile, isPreview, PRODUCT_ITEMS } from '@/server/products/files';
import type { ProductItem } from '@/server/documents/render';

/** A stored file is cheap, but a fresh one costs Chromium; cap it per visitor. */
const PER_HOUR = 60;

/**
 * The customer's newborn extras after payment: clean previews for the receipt, and the files to download
 * (story PNG, sticker PNG and A4 sheet PDF, bottle label PNG and A4 sheet PDF).
 */
export async function GET(_req: Request, { params }: RouteContext<'/r/[token]/extra/[item]'>) {
  const { token, item } = await params;
  if (!(PRODUCT_ITEMS as string[]).includes(item) || item === 'card.preview') return new Response('Not found', { status: 404 });
  const r = await getReceipt(db(), token);
  if (!r || r.status !== 'PAID') return new Response('Not found', { status: 404 });
  const ipHash = hashIp(clientIpFrom(await headers()));
  if (ipHash && !(await consumeRateLimit(db(), `preview:ip:${ipHash}`, PER_HOUR, 3600))) {
    return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '3600' } });
  }
  try {
    const file = await ensureProductFile(db(), r.invitation.id, item as ProductItem);
    return new Response(new Uint8Array(file.data), {
      headers: {
        'Content-Type': file.type,
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex',
        ...(isPreview(item as ProductItem) ? {} : { 'Content-Disposition': `attachment; filename="${file.fileName}"` }),
      },
    });
  } catch (e) {
    if (e instanceof ProductError) return new Response('Not found', { status: 404 });
    throw e;
  }
}

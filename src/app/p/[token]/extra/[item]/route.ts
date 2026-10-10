import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { consumeRateLimit } from '@/server/rate-limit';
import { findByPreviewToken } from '@/server/orders/drafts';
import { ProductError, ensureProductFile, isPreview, PRODUCT_ITEMS } from '@/server/products/files';
import type { ProductItem } from '@/server/documents/render';

export const dynamic = 'force-dynamic';

/**
 * Watermarked previews of a draft's extras (card front, story, sticker, bottle label) for the review page.
 * Only previews: the files themselves are given out on the receipt once paid. The watermark is drawn by the
 * server's render, so the clean picture never reaches the browser before payment.
 */
export async function GET(_req: Request, { params }: RouteContext<'/p/[token]/extra/[item]'>) {
  const { token, item } = await params;
  if (!(PRODUCT_ITEMS as string[]).includes(item) || !isPreview(item as ProductItem)) return new Response('Not found', { status: 404 });
  const inv = await findByPreviewToken(db(), token);
  if (!inv) return new Response('Not found', { status: 404 });
  // A fresh picture costs Chromium; cap it per visitor (shared with the receipt's pictures).
  const ipHash = hashIp(clientIpFrom(await headers()));
  if (ipHash && !(await consumeRateLimit(db(), `preview:ip:${ipHash}`, 60, 3600))) {
    return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '3600' } });
  }
  try {
    const file = await ensureProductFile(db(), inv.id, item as ProductItem);
    return new Response(new Uint8Array(file.data), {
      headers: { 'Content-Type': file.type, 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' },
    });
  } catch (e) {
    if (e instanceof ProductError) return new Response('Not available', { status: 404 });
    throw e;
  }
}

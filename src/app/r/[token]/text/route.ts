import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { publishedForPhotos } from '@/server/photos/http';
import { handleTemplateTextRequest } from '@/server/template/http';

export const dynamic = 'force-dynamic';

/** The customer changes a text of their published template design (packages with `self_edit`), from their receipt. */
export async function PATCH(req: Request, { params }: RouteContext<'/r/[token]/text'>) {
  const { token } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  return handleTemplateTextRequest(db(), req, await publishedForPhotos(db(), token), { ipHash, published: true });
}

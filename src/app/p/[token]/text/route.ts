import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { draftForPhotos } from '@/server/photos/http';
import { handleTemplateTextRequest } from '@/server/template/http';

export const dynamic = 'force-dynamic';

/** A text the customer typed in a template design while ordering, reached only through their private preview link. */
export async function PATCH(req: Request, { params }: RouteContext<'/p/[token]/text'>) {
  const { token } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  return handleTemplateTextRequest(db(), req, await draftForPhotos(db(), token), { ipHash, published: false });
}

import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { draftForPhotos } from '@/server/photos/http';
import { handlePosterRequest } from '@/server/posters/http';

export const dynamic = 'force-dynamic';

/** The poster step while ordering: which pictures each couple poster shows, through the private preview link. */
export async function PATCH(req: Request, { params }: RouteContext<'/p/[token]/poster'>) {
  const { token } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  return handlePosterRequest(db(), req, await draftForPhotos(db(), token), { ipHash, published: false });
}

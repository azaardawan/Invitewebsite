import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { draftForPhotos } from '@/server/photos/http';
import { handlePosterPhotoRequest } from '@/server/posters/http';

export const dynamic = 'force-dynamic';

/** A picture for one poster only, while ordering (through the private preview link). */
async function handle(req: Request, { params }: RouteContext<'/p/[token]/poster/photo/[orientation]'>) {
  const { token, orientation } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  return handlePosterPhotoRequest(db(), req, await draftForPhotos(db(), token), orientation, { ipHash, published: false });
}

export { handle as POST, handle as PATCH, handle as DELETE };

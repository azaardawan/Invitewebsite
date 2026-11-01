import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { publishedForPhotos } from '@/server/photos/http';
import { handlePosterPhotoRequest } from '@/server/posters/http';

export const dynamic = 'force-dynamic';

/** A picture for one poster only, changed after paying (packages with `self_edit`), from the receipt. */
async function handle(req: Request, { params }: RouteContext<'/r/[token]/poster/photo/[orientation]'>) {
  const { token, orientation } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  return handlePosterPhotoRequest(db(), req, await publishedForPhotos(db(), token), orientation, { ipHash, published: true });
}

export { handle as POST, handle as PATCH, handle as DELETE };

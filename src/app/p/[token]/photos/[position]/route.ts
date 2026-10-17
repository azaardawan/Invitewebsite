import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { draftForPhotos, handlePhotoRequest } from '@/server/photos/http';

export const dynamic = 'force-dynamic';

/** The customer's photos while ordering (before checkout), reached only through their private preview link. */
async function handle(req: Request, { params }: RouteContext<'/p/[token]/photos/[position]'>) {
  const { token, position } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  return handlePhotoRequest(db(), req, await draftForPhotos(db(), token), position, { ipHash, published: false });
}

export { handle as POST, handle as PATCH, handle as DELETE };

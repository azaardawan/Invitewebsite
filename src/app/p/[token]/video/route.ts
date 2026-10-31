import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { draftForPhotos } from '@/server/photos/http';
import { handleVideoRequest } from '@/server/video/http';

export const dynamic = 'force-dynamic';
// Converting up to a minute of video takes a while.
export const maxDuration = 300;

/** The customer's own video while ordering (before checkout), reached only through their private preview link. */
async function handle(req: Request, { params }: RouteContext<'/p/[token]/video'>) {
  const { token } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  return handleVideoRequest(db(), req, await draftForPhotos(db(), token), { ipHash, published: false });
}

export { handle as POST, handle as DELETE };

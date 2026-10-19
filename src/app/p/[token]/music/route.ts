import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { draftForPhotos } from '@/server/photos/http';
import { handleSongRequest } from '@/server/music/http';

export const dynamic = 'force-dynamic';

/** The customer's own song while ordering (before checkout), reached only through their private preview link. */
async function handle(req: Request, { params }: RouteContext<'/p/[token]/music'>) {
  const { token } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  return handleSongRequest(db(), req, await draftForPhotos(db(), token), { ipHash, published: false });
}

export { handle as POST, handle as DELETE };

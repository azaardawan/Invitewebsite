import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { publishedForPhotos } from '@/server/photos/http';
import { handleSongRequest } from '@/server/music/http';

export const dynamic = 'force-dynamic';

/** The customer changes the song of their published invitation (packages with `self_edit`), from their receipt. */
async function handle(req: Request, { params }: RouteContext<'/r/[token]/music'>) {
  const { token } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  return handleSongRequest(db(), req, await publishedForPhotos(db(), token), { ipHash, published: true });
}

export { handle as POST, handle as DELETE };

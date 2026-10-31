import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { publishedForPhotos } from '@/server/photos/http';
import { handleVideoRequest } from '@/server/video/http';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** The customer changes the video of their published page (packages with `self_edit`), from their receipt. */
async function handle(req: Request, { params }: RouteContext<'/r/[token]/video'>) {
  const { token } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  return handleVideoRequest(db(), req, await publishedForPhotos(db(), token), { ipHash, published: true });
}

export { handle as POST, handle as DELETE };

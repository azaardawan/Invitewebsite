import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { handlePhotoRequest, publishedForPhotos } from '@/server/photos/http';

export const dynamic = 'force-dynamic';

/** The customer changes the photos of their published invitation (packages with `self_edit`), from their receipt. */
async function handle(req: Request, { params }: RouteContext<'/r/[token]/photos/[position]'>) {
  const { token, position } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  return handlePhotoRequest(db(), req, await publishedForPhotos(db(), token), position, { ipHash, published: true });
}

export { handle as POST, handle as PATCH, handle as DELETE };

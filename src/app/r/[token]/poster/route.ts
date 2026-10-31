import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { publishedForPhotos } from '@/server/photos/http';
import { handlePosterRequest } from '@/server/posters/http';

export const dynamic = 'force-dynamic';

/** The customer changes their posters' pictures after paying (packages with `self_edit`), from their receipt. */
export async function PATCH(req: Request, { params }: RouteContext<'/r/[token]/poster'>) {
  const { token } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  return handlePosterRequest(db(), req, await publishedForPhotos(db(), token), { ipHash, published: true });
}

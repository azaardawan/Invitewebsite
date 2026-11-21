import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { guestPhotos } from '@/server/db/schema';
import { storage } from '@/server/storage';
import { requireAdmin } from '@/server/auth/guard';
import { noStore } from '@/server/guest-photos/http';

/** A guest's photo for the team (Admin → the invitation): small with `?thumb=1`, otherwise as sent. */
export async function GET(req: Request, { params }: RouteContext<'/admin/guest-photos/[id]'>) {
  await requireAdmin({ permission: 'invitations.view' });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response('Not found', { status: 404, headers: noStore });
  const [photo] = await db().select().from(guestPhotos).where(eq(guestPhotos.id, id));
  if (!photo) return new Response('Not found', { status: 404, headers: noStore });
  const thumb = new URL(req.url).searchParams.get('thumb') === '1' && photo.thumbKey;
  const body = await storage().get(thumb ? photo.thumbKey! : photo.storageKey);
  if (!body) return new Response('Not found', { status: 404, headers: noStore });
  return new Response(new Uint8Array(body), { headers: { ...noStore, 'Content-Type': thumb ? 'image/jpeg' : photo.contentType } });
}

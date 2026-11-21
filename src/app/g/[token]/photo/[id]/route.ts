import { headers } from 'next/headers';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { storage } from '@/server/storage';
import { isSameOrigin } from '@/server/auth/same-origin';
import { GuestPhotoError, deleteOwnPhoto, guestPhotoOf, invitationByUploadToken } from '@/server/guest-photos/service';
import { currentDevice, noStore } from '@/server/guest-photos/http';

/** A guest's own photo, small (only the phone that sent it sees it here). */
export async function GET(_req: Request, { params }: RouteContext<'/g/[token]/photo/[id]'>) {
  const { token, id } = await params;
  const inv = await invitationByUploadToken(db(), token);
  const device = await currentDevice(token);
  const photo = inv && device && z.uuid().safeParse(id).success ? await guestPhotoOf(db(), inv.id, id) : null;
  if (!photo || photo.deviceHash !== device || !photo.thumbKey) return new Response('Not found', { status: 404, headers: noStore });
  const body = await storage().get(photo.thumbKey);
  if (!body) return new Response('Not found', { status: 404, headers: noStore });
  return new Response(new Uint8Array(body), { headers: { ...noStore, 'Content-Type': 'image/jpeg' } });
}

/** A guest removes their own photo while uploading is open. */
export async function DELETE(_req: Request, { params }: RouteContext<'/g/[token]/photo/[id]'>) {
  const { token, id } = await params;
  if (!isSameOrigin(await headers())) return Response.json({ error: 'forbidden' }, { status: 403, headers: noStore });
  const inv = await invitationByUploadToken(db(), token);
  const device = await currentDevice(token);
  if (!inv || !device || !z.uuid().safeParse(id).success) return Response.json({ error: 'notFound' }, { status: 404, headers: noStore });
  try {
    await deleteOwnPhoto(db(), inv, device, id);
    return Response.json({ ok: true }, { headers: noStore });
  } catch (e) {
    if (e instanceof GuestPhotoError) return Response.json({ error: e.code }, { status: 409, headers: noStore });
    throw e;
  }
}

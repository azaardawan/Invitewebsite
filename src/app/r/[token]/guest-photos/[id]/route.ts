import { headers } from 'next/headers';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { storage } from '@/server/storage';
import { isSameOrigin } from '@/server/auth/same-origin';
import { GuestPhotoError, guestPhotoOf, removeGuestPhoto } from '@/server/guest-photos/service';
import { noStore, receiptGuestPhotoInvitation } from '@/server/guest-photos/http';

/** One guest photo for the couple: small (default) or as sent (`?full=1`). */
export async function GET(req: Request, { params }: RouteContext<'/r/[token]/guest-photos/[id]'>) {
  const { token, id } = await params;
  const inv = await receiptGuestPhotoInvitation(db(), token);
  const photo = inv && z.uuid().safeParse(id).success ? await guestPhotoOf(db(), inv.id, id) : null;
  if (!photo) return new Response('Not found', { status: 404, headers: noStore });
  const full = new URL(req.url).searchParams.get('full') === '1' || !photo.thumbKey;
  const body = await storage().get(full ? photo.storageKey : photo.thumbKey!);
  if (!body) return new Response('Not found', { status: 404, headers: noStore });
  return new Response(new Uint8Array(body), { headers: { ...noStore, 'Content-Type': full ? photo.contentType : 'image/jpeg' } });
}

/** The couple removes a guest's photo. */
export async function DELETE(_req: Request, { params }: RouteContext<'/r/[token]/guest-photos/[id]'>) {
  const { token, id } = await params;
  if (!isSameOrigin(await headers())) return Response.json({ error: 'forbidden' }, { status: 403, headers: noStore });
  const inv = await receiptGuestPhotoInvitation(db(), token);
  if (!inv || !z.uuid().safeParse(id).success) return Response.json({ error: 'notFound' }, { status: 404, headers: noStore });
  try {
    await removeGuestPhoto(db(), inv.id, id);
    return Response.json({ ok: true }, { headers: noStore });
  } catch (e) {
    if (e instanceof GuestPhotoError) return Response.json({ error: e.code }, { status: 404, headers: noStore });
    throw e;
  }
}

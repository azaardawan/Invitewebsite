import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { isSameOrigin } from '@/server/auth/same-origin';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { consumeRateLimit } from '@/server/rate-limit';
import { GuestPhotoError, invitationByUploadToken, uploadGuestPhoto } from '@/server/guest-photos/service';
import { ensureDevice, noStore } from '@/server/guest-photos/http';
import { MAX_PHOTO_BYTES } from '@/catalog/guest-photos';

/** Uploads per visitor per hour: a whole table's phones may share one network at a wedding. */
const UPLOADS_PER_HOUR = 300;

/** A guest's photo (guest photo sharing): `name` and `photo`. Answers the photo's id, or an error code. */
export async function POST(req: Request, { params }: RouteContext<'/g/[token]/upload'>) {
  const { token } = await params;
  const h = await headers();
  if (!isSameOrigin(h)) return Response.json({ error: 'forbidden' }, { status: 403, headers: noStore });
  const inv = await invitationByUploadToken(db(), token);
  if (!inv) return Response.json({ error: 'notFound' }, { status: 404, headers: noStore });
  if (Number(h.get('content-length') ?? 0) > MAX_PHOTO_BYTES + 64 * 1024) return Response.json({ error: 'tooBig' }, { status: 413, headers: noStore });
  const ipHash = hashIp(clientIpFrom(h));
  if (ipHash && !(await consumeRateLimit(db(), `guest-upload:ip:${ipHash}`, UPLOADS_PER_HOUR, 3600))) return Response.json({ error: 'rateLimited' }, { status: 429, headers: noStore });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: 'type' }, { status: 400, headers: noStore });
  }
  const file = form.get('photo');
  if (!(file instanceof File)) return Response.json({ error: 'type' }, { status: 400, headers: noStore });
  if (file.size > MAX_PHOTO_BYTES) return Response.json({ error: 'tooBig' }, { status: 413, headers: noStore });
  const deviceHash = await ensureDevice(token);
  try {
    const photo = await uploadGuestPhoto(db(), inv, { deviceHash, name: String(form.get('name') ?? ''), bytes: Buffer.from(await file.arrayBuffer()) });
    return Response.json({ id: photo.id, thumb: Boolean(photo.thumbKey) }, { headers: noStore });
  } catch (e) {
    if (e instanceof GuestPhotoError) return Response.json({ error: e.code }, { status: e.code === 'notFound' ? 404 : 409, headers: noStore });
    throw e;
  }
}

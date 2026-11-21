import { Readable } from 'node:stream';
import { db } from '@/server/db/client';
import { guestPhotosZip, photosByGuest } from '@/server/guest-photos/service';
import { noStore, receiptGuestPhotoInvitation } from '@/server/guest-photos/http';

/** Every guest's photos: one ZIP holding a ZIP per guest name (owner, 2026-11-21), streamed. */
export async function GET(_req: Request, { params }: RouteContext<'/r/[token]/guest-photos/zip'>) {
  const { token } = await params;
  const inv = await receiptGuestPhotoInvitation(db(), token);
  if (!inv) return new Response('Not found', { status: 404, headers: noStore });
  const { groups } = await photosByGuest(db(), inv.id);
  const stream = Readable.toWeb(guestPhotosZip(groups)) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    headers: { ...noStore, 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="guest-photos-${inv.publicId}.zip"` },
  });
}

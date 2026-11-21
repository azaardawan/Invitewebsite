import QRCode from 'qrcode';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { themeVersions } from '@/server/db/schema';
import { env } from '@/server/env';
import { manifestByCodeRef } from '@/theme-registry';
import { noStore, receiptGuestPhotoInvitation } from '@/server/guest-photos/http';

/**
 * The photo QR code as a PNG (owner, 2026-11-21): opens the guests' upload page; in the design's QR colours when it
 * has them. Only for a paid order (the receipt helper checks it).
 */
export async function GET(_req: Request, { params }: RouteContext<'/r/[token]/guest-photos/qr'>) {
  const { token } = await params;
  const inv = await receiptGuestPhotoInvitation(db(), token);
  if (!inv?.guestPhotosToken) return new Response('Not found', { status: 404, headers: noStore });
  const [v] = await db().select({ codeRef: themeVersions.codeRef }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
  const colors = (v && manifestByCodeRef(v.codeRef)?.print?.card?.qrColors) || { dark: '#3a1520', light: '#ffffff' };
  const url = `${env().APP_URL.replace(/\/$/, '')}/g/${inv.guestPhotosToken}`;
  const png = await QRCode.toBuffer(url, { type: 'png', width: 1200, margin: 2, errorCorrectionLevel: 'M', color: colors });
  return new Response(new Uint8Array(png), {
    headers: { ...noStore, 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="photo-qr-${inv.publicId}.png"` },
  });
}

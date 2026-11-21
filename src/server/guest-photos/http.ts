import 'server-only';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations, orders } from '@/server/db/schema';
import { receiptTokenHash } from '@/server/orders/tokens';
import { env } from '@/server/env';
import { deviceHashOf, newDeviceToken } from './service';

/** The guest's phone token: one cookie per upload page, kept for a year. */
const cookieName = (uploadToken: string) => `bahja_gp_${uploadToken.slice(0, 12)}`;

/** This phone's hash on this upload page, or null before its first upload. */
export async function currentDevice(uploadToken: string): Promise<string | null> {
  const v = (await cookies()).get(cookieName(uploadToken))?.value;
  return v && /^[A-Za-z0-9_-]{20,64}$/.test(v) ? deviceHashOf(v) : null;
}

/** This phone's hash, giving it a token the first time. */
export async function ensureDevice(uploadToken: string): Promise<string> {
  const jar = await cookies();
  let v = jar.get(cookieName(uploadToken))?.value;
  if (!v || !/^[A-Za-z0-9_-]{20,64}$/.test(v)) {
    v = newDeviceToken();
    jar.set(cookieName(uploadToken), v, { httpOnly: true, secure: env().APP_URL.startsWith('https://'), sameSite: 'lax', path: `/g/${uploadToken}`, maxAge: 365 * 86400 });
  }
  return deviceHashOf(v);
}

/** The paid invitation behind a receipt link that bought guest photo sharing, or null. */
export async function receiptGuestPhotoInvitation(db: DbOrTx, receiptToken: string) {
  if (!receiptToken || receiptToken.length > 100) return null;
  const [row] = await db
    .select({ order: orders, inv: invitations })
    .from(orders)
    .innerJoin(invitations, eq(invitations.id, orders.invitationId))
    .where(eq(orders.receiptTokenHash, receiptTokenHash(receiptToken)));
  return row && row.order.status === 'PAID' && row.inv.guestPhotosCap ? row.inv : null;
}

export const noStore = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } as const;

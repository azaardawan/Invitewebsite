import 'server-only';
import { and, desc, eq, gt, lte } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { adminTrustedDevices } from '@/server/db/schema';
import { randomToken, sha256 } from '@/lib/crypto';
import type { RequestContext } from './request-context';

/**
 * Remembered devices (owner, 2026-11-16): after a sign-in with a code, an admin may tick «don't ask for a code on this
 * device for 30 days». The device then holds a random token in a cookie; a sign-in with the right password and that
 * token skips the code. The password is always needed. All of a user's devices are forgotten when their password or
 * two-step verification changes, or their account is disabled.
 */
export const TRUSTED_DEVICE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** No more than this many per user: the oldest are forgotten. */
const MAX_DEVICES = 10;

export type TrustedDevice = typeof adminTrustedDevices.$inferSelect;

const hashOf = (token: string) => sha256(`device:${token}`);

export async function rememberDevice(db: DbOrTx, userId: string, ctx: RequestContext, now = new Date()): Promise<string> {
  const token = randomToken(32);
  await db.delete(adminTrustedDevices).where(and(eq(adminTrustedDevices.userId, userId), lte(adminTrustedDevices.expiresAt, now)));
  await db.insert(adminTrustedDevices).values({
    tokenHash: hashOf(token),
    userId,
    createdAt: now,
    lastUsedAt: now,
    expiresAt: new Date(now.getTime() + TRUSTED_DEVICE_TTL_MS),
    ipHash: ctx.ipHash,
    userAgent: ctx.userAgent,
  });
  const extra = (await listTrustedDevices(db, userId, now)).slice(MAX_DEVICES);
  for (const d of extra) await db.delete(adminTrustedDevices).where(eq(adminTrustedDevices.id, d.id));
  return token;
}

/** Whether this token is a live remembered device of this user (and notes its use). */
export async function isTrustedDevice(db: DbOrTx, userId: string, token: string | null | undefined, now = new Date()): Promise<boolean> {
  if (!token || token.length > 200) return false;
  const used = await db
    .update(adminTrustedDevices)
    .set({ lastUsedAt: now })
    .where(and(eq(adminTrustedDevices.tokenHash, hashOf(token)), eq(adminTrustedDevices.userId, userId), gt(adminTrustedDevices.expiresAt, now)))
    .returning({ id: adminTrustedDevices.id });
  return used.length === 1;
}

/** A user's live remembered devices, the most recently used first. */
export async function listTrustedDevices(db: DbOrTx, userId: string, now = new Date()): Promise<TrustedDevice[]> {
  return db
    .select()
    .from(adminTrustedDevices)
    .where(and(eq(adminTrustedDevices.userId, userId), gt(adminTrustedDevices.expiresAt, now)))
    .orderBy(desc(adminTrustedDevices.lastUsedAt));
}

/** Forgets one device of a user; false when it was not theirs. */
export async function forgetDevice(db: DbOrTx, userId: string, deviceId: string): Promise<boolean> {
  const gone = await db
    .delete(adminTrustedDevices)
    .where(and(eq(adminTrustedDevices.id, deviceId), eq(adminTrustedDevices.userId, userId)))
    .returning({ id: adminTrustedDevices.id });
  return gone.length === 1;
}

export async function forgetUserDevices(db: DbOrTx, userId: string): Promise<number> {
  const gone = await db.delete(adminTrustedDevices).where(eq(adminTrustedDevices.userId, userId)).returning({ id: adminTrustedDevices.id });
  return gone.length;
}

/** Whether a token is this stored device (to mark «this device» in the list). */
export const isThisDevice = (device: TrustedDevice, token: string | null | undefined) => Boolean(token) && device.tokenHash === hashOf(token!);

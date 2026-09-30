import 'server-only';
import { and, eq, isNull, ne } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { adminSessions, adminUsers } from '@/server/db/schema';
import { randomToken, sha256 } from '@/lib/crypto';
import type { RequestContext } from './request-context';

export const SESSION_POLICY = {
  absoluteTtlMs: 12 * 60 * 60 * 1000,
  idleTtlMs: 2 * 60 * 60 * 1000,
  /** Sessions still waiting for 2FA (verification or first-time setup). */
  pendingTtlMs: 30 * 60 * 1000,
  touchIntervalMs: 5 * 60 * 1000,
} as const;

export type SessionRecord = typeof adminSessions.$inferSelect;
export type AdminUserRecord = typeof adminUsers.$inferSelect;

export function sessionIdFromToken(token: string) {
  return sha256(`session:${token}`);
}

export async function createSession(
  db: DbOrTx,
  userId: string,
  opts: { mfaVerified: boolean; ctx: RequestContext; now?: Date },
): Promise<{ token: string; session: SessionRecord }> {
  const now = opts.now ?? new Date();
  const token = randomToken(32);
  const ttl = opts.mfaVerified ? SESSION_POLICY.absoluteTtlMs : SESSION_POLICY.pendingTtlMs;
  const [session] = await db
    .insert(adminSessions)
    .values({
      id: sessionIdFromToken(token),
      userId,
      mfaVerifiedAt: opts.mfaVerified ? now : null,
      createdAt: now,
      lastSeenAt: now,
      expiresAt: new Date(now.getTime() + ttl),
      ipHash: opts.ctx.ipHash,
      userAgent: opts.ctx.userAgent,
    })
    .returning();
  return { token, session: session! };
}

/** Returns the live session and its user, or null if missing/expired/revoked/idle/disabled. */
export async function validateSessionToken(
  db: DbOrTx,
  token: string,
  now = new Date(),
): Promise<{ session: SessionRecord; user: AdminUserRecord } | null> {
  if (!token || token.length > 200) return null;
  const [row] = await db
    .select({ session: adminSessions, user: adminUsers })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.userId))
    .where(eq(adminSessions.id, sessionIdFromToken(token)));
  if (!row) return null;
  const { session, user } = row;
  if (session.revokedAt || session.expiresAt <= now || user.status !== 'ACTIVE') return null;
  if (now.getTime() - session.lastSeenAt.getTime() > SESSION_POLICY.idleTtlMs) {
    await revokeSession(db, session.id);
    return null;
  }
  if (now.getTime() - session.lastSeenAt.getTime() > SESSION_POLICY.touchIntervalMs) {
    await db.update(adminSessions).set({ lastSeenAt: now }).where(eq(adminSessions.id, session.id));
  }
  return { session, user };
}

export async function revokeSession(db: DbOrTx, sessionId: string) {
  await db
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(adminSessions.id, sessionId), isNull(adminSessions.revokedAt)));
}

/** Revokes all of a user's sessions, optionally keeping one (e.g. the current one). */
export async function revokeUserSessions(db: DbOrTx, userId: string, exceptSessionId?: string) {
  const conditions = [eq(adminSessions.userId, userId), isNull(adminSessions.revokedAt)];
  if (exceptSessionId) conditions.push(ne(adminSessions.id, exceptSessionId));
  await db.update(adminSessions).set({ revokedAt: new Date() }).where(and(...conditions));
}

export type AuthStep = 'verify-2fa' | 'setup-2fa' | 'change-password' | 'ok';

/** Where a signed-in admin must go before they can use the admin panel. */
export function nextAuthStep(user: AdminUserRecord, session: SessionRecord): AuthStep {
  if (!session.mfaVerifiedAt) return user.totpEnabledAt ? 'verify-2fa' : 'setup-2fa';
  if (user.mustChangePassword) return 'change-password';
  return 'ok';
}

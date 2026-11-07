import 'server-only';
import { and, count, eq, gte, isNull } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { authAttempts } from '@/server/db/schema';

export const RATE_LIMITS = {
  windowMs: 15 * 60 * 1000,
  /** Wrong passwords for one email from one address (so nobody else can lock the real admin out). */
  passwordFailuresPerEmail: 5,
  /** Wrong passwords from one address, whatever the email. */
  passwordFailuresPerIp: 30,
  secondFactorFailuresPerUser: 5,
} as const;

function since() {
  return new Date(Date.now() - RATE_LIMITS.windowMs);
}

type Attempt = { kind: 'password' | 'totp'; emailLower?: string; userId?: string; ipHash: string | null };

/**
 * Starts an attempt: it is written down as a failure *before* the password or code is checked, then the failures are
 * counted with it. So concurrent requests cannot all pass the check before any of them is recorded: at most the limit
 * get through. `blocked` when this attempt is over a limit; else call finishAuthAttempt with the outcome.
 *
 * Password limits are per (email, address) and per address: failures from other addresses never lock the real admin
 * out. A password alone opens nothing (every admin has a second factor, limited per user below).
 */
export async function startAuthAttempt(db: DbOrTx, attempt: Attempt): Promise<{ id: number; blocked: boolean }> {
  const [row] = await db
    .insert(authAttempts)
    .values({ kind: attempt.kind, emailLower: attempt.emailLower ?? null, userId: attempt.userId ?? null, ipHash: attempt.ipHash, success: false })
    .returning({ id: authAttempts.id });
  const failures = async (...where: Parameters<typeof and>) =>
    (await db.select({ n: count() }).from(authAttempts).where(and(eq(authAttempts.success, false), gte(authAttempts.createdAt, since()), ...where)))[0]?.n ?? 0;
  const sameIp = attempt.ipHash ? eq(authAttempts.ipHash, attempt.ipHash) : isNull(authAttempts.ipHash);

  let blocked: boolean;
  if (attempt.kind === 'totp') {
    blocked = (await failures(eq(authAttempts.kind, 'totp'), eq(authAttempts.userId, attempt.userId!))) > RATE_LIMITS.secondFactorFailuresPerUser;
  } else {
    blocked =
      (await failures(eq(authAttempts.kind, 'password'), eq(authAttempts.emailLower, attempt.emailLower!), sameIp)) > RATE_LIMITS.passwordFailuresPerEmail ||
      (!!attempt.ipHash && (await failures(eq(authAttempts.ipHash, attempt.ipHash))) > RATE_LIMITS.passwordFailuresPerIp);
  }
  return { id: row!.id, blocked };
}

/** The outcome of an attempt started with startAuthAttempt (it stays a failure unless it succeeded). */
export async function finishAuthAttempt(db: DbOrTx, id: number, result: { success: boolean; userId?: string }) {
  if (result.success || result.userId) {
    await db.update(authAttempts).set({ success: result.success, ...(result.userId ? { userId: result.userId } : {}) }).where(eq(authAttempts.id, id));
  }
}

import 'server-only';
import { and, count, eq, gte } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { authAttempts } from '@/server/db/schema';

export const RATE_LIMITS = {
  windowMs: 15 * 60 * 1000,
  passwordFailuresPerEmail: 5,
  passwordFailuresPerIp: 30,
  secondFactorFailuresPerUser: 5,
} as const;

function since() {
  return new Date(Date.now() - RATE_LIMITS.windowMs);
}

export async function isPasswordLoginBlocked(db: DbOrTx, emailLower: string, ipHash: string | null) {
  const [byEmail] = await db
    .select({ n: count() })
    .from(authAttempts)
    .where(
      and(
        eq(authAttempts.kind, 'password'),
        eq(authAttempts.emailLower, emailLower),
        eq(authAttempts.success, false),
        gte(authAttempts.createdAt, since()),
      ),
    );
  if ((byEmail?.n ?? 0) >= RATE_LIMITS.passwordFailuresPerEmail) return true;
  if (!ipHash) return false;
  const [byIp] = await db
    .select({ n: count() })
    .from(authAttempts)
    .where(and(eq(authAttempts.ipHash, ipHash), eq(authAttempts.success, false), gte(authAttempts.createdAt, since())));
  return (byIp?.n ?? 0) >= RATE_LIMITS.passwordFailuresPerIp;
}

export async function isSecondFactorBlocked(db: DbOrTx, userId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(authAttempts)
    .where(
      and(
        eq(authAttempts.kind, 'totp'),
        eq(authAttempts.userId, userId),
        eq(authAttempts.success, false),
        gte(authAttempts.createdAt, since()),
      ),
    );
  return (row?.n ?? 0) >= RATE_LIMITS.secondFactorFailuresPerUser;
}

export async function recordAuthAttempt(
  db: DbOrTx,
  attempt: { kind: 'password' | 'totp'; emailLower?: string; userId?: string; ipHash: string | null; success: boolean },
) {
  await db.insert(authAttempts).values({
    kind: attempt.kind,
    emailLower: attempt.emailLower ?? null,
    userId: attempt.userId ?? null,
    ipHash: attempt.ipHash,
    success: attempt.success,
  });
}

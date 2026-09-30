import 'server-only';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { adminRecoveryCodes, adminUsers } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { hashPassword, passwordProblem, verifyAgainstDummy, verifyPassword } from './password';
import { isPasswordLoginBlocked, isSecondFactorBlocked, recordAuthAttempt } from './rate-limit';
import type { RequestContext } from './request-context';
import { createSession, nextAuthStep, revokeSession, revokeUserSessions, type AuthStep, type SessionRecord } from './session';
import {
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  normalizeRecoveryCode,
  totpUri,
  verifyTotp,
} from './totp';

export type LoginResult =
  | { ok: true; token: string; step: AuthStep }
  | { ok: false; error: 'invalid' | 'rateLimited' };

/** Step 1: email + password. Errors are deliberately generic. */
export async function loginWithPassword(
  db: DbOrTx,
  input: { email: string; password: string },
  ctx: RequestContext,
): Promise<LoginResult> {
  const emailLower = input.email.trim().toLowerCase();
  if (await isPasswordLoginBlocked(db, emailLower, ctx.ipHash)) {
    return { ok: false, error: 'rateLimited' };
  }

  const [user] = await db.select().from(adminUsers).where(sql`lower(${adminUsers.email}) = ${emailLower}`);
  const valid = user
    ? user.status === 'ACTIVE' && (await verifyPassword(user.passwordHash, input.password))
    : await verifyAgainstDummy(input.password);

  await recordAuthAttempt(db, { kind: 'password', emailLower, userId: user?.id, ipHash: ctx.ipHash, success: valid });
  if (!valid || !user) {
    if (user) {
      await recordAudit(db, {
        actorType: 'ADMIN',
        actorAdminId: user.id,
        action: 'auth.login_failed',
        objectType: 'admin_user',
        objectId: user.id,
        ipHash: ctx.ipHash,
      });
    }
    return { ok: false, error: 'invalid' };
  }

  // Every admin must pass a second factor, so a password alone only yields a pending session.
  const { token, session } = await createSession(db, user.id, { mfaVerified: false, ctx });
  await recordAudit(db, {
    actorType: 'ADMIN',
    actorAdminId: user.id,
    action: 'auth.password_accepted',
    objectType: 'admin_user',
    objectId: user.id,
    ipHash: ctx.ipHash,
  });
  return { ok: true, token, step: nextAuthStep(user, session) };
}

export type SecondFactorResult =
  | { ok: true; token: string; step: AuthStep; usedRecoveryCode: boolean }
  | { ok: false; error: 'invalid' | 'rateLimited' | 'notEnrolled' };

/** Step 2: TOTP code or a one-time recovery code. Rotates the session on success. */
export async function verifySecondFactor(
  db: DbOrTx,
  session: SessionRecord,
  code: string,
  ctx: RequestContext,
): Promise<SecondFactorResult> {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.userId));
  if (!user?.totpEnabledAt || !user.totpSecretEnc) return { ok: false, error: 'notEnrolled' };
  if (await isSecondFactorBlocked(db, user.id)) return { ok: false, error: 'rateLimited' };

  let usedRecoveryCode = false;
  let accepted = false;
  const trimmed = code.trim();

  if (/^\d[\d\s]*$/.test(trimmed)) {
    const step = verifyTotp(decryptSecret(user.totpSecretEnc), trimmed);
    if (step !== null) {
      // Atomic replay protection: only succeeds if this step is newer than the last accepted one.
      const updated = await db
        .update(adminUsers)
        .set({ totpLastStep: step })
        .where(
          and(
            eq(adminUsers.id, user.id),
            sql`(${adminUsers.totpLastStep} IS NULL OR ${adminUsers.totpLastStep} < ${step})`,
          ),
        )
        .returning({ id: adminUsers.id });
      accepted = updated.length === 1;
    }
  } else if (normalizeRecoveryCode(trimmed).length === 10) {
    const used = await db
      .update(adminRecoveryCodes)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(adminRecoveryCodes.userId, user.id),
          eq(adminRecoveryCodes.codeHash, hashRecoveryCode(trimmed)),
          isNull(adminRecoveryCodes.usedAt),
        ),
      )
      .returning({ id: adminRecoveryCodes.id });
    accepted = used.length === 1;
    usedRecoveryCode = accepted;
  }

  await recordAuthAttempt(db, { kind: 'totp', userId: user.id, ipHash: ctx.ipHash, success: accepted });
  if (!accepted) return { ok: false, error: 'invalid' };

  const next = await db.transaction(async (tx) => {
    await revokeSession(tx, session.id);
    const created = await createSession(tx, user.id, { mfaVerified: true, ctx });
    await tx.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
    await recordAudit(tx, {
      actorType: 'ADMIN',
      actorAdminId: user.id,
      action: usedRecoveryCode ? 'auth.login_recovery_code' : 'auth.login',
      objectType: 'admin_user',
      objectId: user.id,
      ipHash: ctx.ipHash,
    });
    return created;
  });
  return { ok: true, token: next.token, step: nextAuthStep(user, next.session), usedRecoveryCode };
}

/** Starts (or restarts) 2FA enrollment for a user who has not enabled it yet. */
export async function beginTotpEnrollment(db: DbOrTx, userId: string) {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, userId));
  if (!user) throw new Error('User not found');
  if (user.totpEnabledAt) throw new Error('2FA is already enabled');
  const secret = user.totpSecretEnc ? decryptSecret(user.totpSecretEnc) : generateTotpSecret();
  if (!user.totpSecretEnc) {
    await db.update(adminUsers).set({ totpSecretEnc: encryptSecret(secret) }).where(eq(adminUsers.id, userId));
  }
  return { secret, uri: totpUri(user.email, secret) };
}

export type EnrollmentResult =
  | { ok: true; token: string; recoveryCodes: string[]; step: AuthStep }
  | { ok: false; error: 'invalid' | 'rateLimited' | 'notStarted' };

/** Confirms enrollment with a first valid code; returns recovery codes (shown once). */
export async function confirmTotpEnrollment(
  db: DbOrTx,
  session: SessionRecord,
  code: string,
  ctx: RequestContext,
): Promise<EnrollmentResult> {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.userId));
  if (!user?.totpSecretEnc || user.totpEnabledAt) return { ok: false, error: 'notStarted' };
  if (await isSecondFactorBlocked(db, user.id)) return { ok: false, error: 'rateLimited' };

  const step = verifyTotp(decryptSecret(user.totpSecretEnc), code);
  await recordAuthAttempt(db, { kind: 'totp', userId: user.id, ipHash: ctx.ipHash, success: step !== null });
  if (step === null) return { ok: false, error: 'invalid' };

  const recoveryCodes = generateRecoveryCodes();
  const now = new Date();
  const next = await db.transaction(async (tx) => {
    await tx
      .update(adminUsers)
      .set({ totpEnabledAt: now, totpLastStep: step, lastLoginAt: now })
      .where(eq(adminUsers.id, user.id));
    await tx.delete(adminRecoveryCodes).where(eq(adminRecoveryCodes.userId, user.id));
    await tx
      .insert(adminRecoveryCodes)
      .values(recoveryCodes.map((c) => ({ userId: user.id, codeHash: hashRecoveryCode(c) })));
    await revokeSession(tx, session.id);
    const created = await createSession(tx, user.id, { mfaVerified: true, ctx });
    await recordAudit(tx, {
      actorType: 'ADMIN',
      actorAdminId: user.id,
      action: 'auth.2fa_enabled',
      objectType: 'admin_user',
      objectId: user.id,
      ipHash: ctx.ipHash,
    });
    return created;
  });
  return { ok: true, token: next.token, recoveryCodes, step: nextAuthStep({ ...user, totpEnabledAt: now }, next.session) };
}

export type ChangePasswordResult = { ok: true } | { ok: false; error: 'wrongCurrent' | 'sameAsCurrent' | string };

export async function changePassword(
  db: DbOrTx,
  session: SessionRecord,
  input: { current: string; next: string },
  ctx: RequestContext,
): Promise<ChangePasswordResult> {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.userId));
  if (!user) return { ok: false, error: 'wrongCurrent' };
  if (!(await verifyPassword(user.passwordHash, input.current))) return { ok: false, error: 'wrongCurrent' };
  if (input.current === input.next) return { ok: false, error: 'sameAsCurrent' };
  const problem = passwordProblem(input.next, { email: user.email });
  if (problem) return { ok: false, error: problem };

  const passwordHash = await hashPassword(input.next);
  await db.transaction(async (tx) => {
    await tx.update(adminUsers).set({ passwordHash, mustChangePassword: false }).where(eq(adminUsers.id, user.id));
    await revokeUserSessions(tx, user.id, session.id);
    await recordAudit(tx, {
      actorType: 'ADMIN',
      actorAdminId: user.id,
      action: 'auth.password_changed',
      objectType: 'admin_user',
      objectId: user.id,
      ipHash: ctx.ipHash,
    });
  });
  return { ok: true };
}

export async function logout(db: DbOrTx, session: SessionRecord, ctx: RequestContext) {
  await revokeSession(db, session.id);
  await recordAudit(db, {
    actorType: 'ADMIN',
    actorAdminId: session.userId,
    action: 'auth.logout',
    objectType: 'admin_user',
    objectId: session.userId,
    ipHash: ctx.ipHash,
  });
}

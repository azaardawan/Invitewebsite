import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { adminSessions, adminUsers, auditLogs } from '@/server/db/schema';
import {
  beginTotpEnrollment,
  changePassword,
  confirmTotpEnrollment,
  loginWithPassword,
  verifySecondFactor,
} from '@/server/auth/service';
import { SESSION_POLICY, sessionIdFromToken, validateSessionToken } from '@/server/auth/session';
import { setUserStatus } from '@/server/admin/users';
import { ctx, ensureSeeded, makeAdmin, totpCode } from '../helpers';

async function sessionFor(token: string) {
  const valid = await validateSessionToken(db(), token);
  if (!valid) throw new Error('expected a valid session');
  return valid.session;
}

/** Signs in and completes 2FA enrollment; returns everything needed for later steps. */
async function enrolledAdmin() {
  const admin = await makeAdmin();
  const login = await loginWithPassword(db(), { email: admin.email, password: admin.password }, ctx);
  if (!login.ok) throw new Error('login failed');
  const { secret } = await beginTotpEnrollment(db(), admin.id);
  const confirmed = await confirmTotpEnrollment(db(), await sessionFor(login.token), totpCode(secret), ctx);
  if (!confirmed.ok) throw new Error('enrollment failed');
  return { ...admin, secret, token: confirmed.token, recoveryCodes: confirmed.recoveryCodes };
}

beforeAll(ensureSeeded);

describe('password step', () => {
  it('rejects a wrong password and an unknown email with the same generic error', async () => {
    const admin = await makeAdmin();
    expect(await loginWithPassword(db(), { email: admin.email, password: 'wrong password!!' }, ctx)).toEqual({
      ok: false,
      error: 'invalid',
    });
    expect(await loginWithPassword(db(), { email: 'nobody@example.test', password: 'x' }, ctx)).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('is case-insensitive on email and only grants a pending (unverified) session', async () => {
    const admin = await makeAdmin();
    const result = await loginWithPassword(db(), { email: admin.email.toUpperCase(), password: admin.password }, ctx);
    expect(result.ok && result.step).toBe('setup-2fa');
    if (!result.ok) return;
    const session = await sessionFor(result.token);
    expect(session.mfaVerifiedAt).toBeNull();
    expect(session.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(SESSION_POLICY.pendingTtlMs);
    // Only the hash of the token is stored.
    expect(session.id).toBe(sessionIdFromToken(result.token));
    expect(session.id).not.toContain(result.token);
  });

  it('locks the account after 5 failures, even for the right password', async () => {
    const admin = await makeAdmin();
    for (let i = 0; i < 5; i++) {
      await loginWithPassword(db(), { email: admin.email, password: `wrong-${i}-password` }, { ...ctx, ipHash: `ip-${i}` });
    }
    expect(await loginWithPassword(db(), { email: admin.email, password: admin.password }, ctx)).toEqual({
      ok: false,
      error: 'rateLimited',
    });
  });

  it('refuses disabled users', async () => {
    const owner = await makeAdmin();
    const other = await makeAdmin(['SUPPORT']);
    await setUserStatus(db(), other.id, 'DISABLED', { adminId: owner.id, ipHash: null });
    const result = await loginWithPassword(db(), { email: other.email, password: other.password }, ctx);
    expect(result).toEqual({ ok: false, error: 'invalid' });
  });
});

describe('two-factor enrollment and verification', () => {
  it('enrollment verifies the session and issues 10 single-use recovery codes', async () => {
    const admin = await enrolledAdmin();
    expect(admin.recoveryCodes).toHaveLength(10);
    const session = await sessionFor(admin.token);
    expect(session.mfaVerifiedAt).not.toBeNull();
    const [user] = await db().select().from(adminUsers).where(eq(adminUsers.id, admin.id));
    expect(user!.totpEnabledAt).not.toBeNull();
    expect(user!.totpSecretEnc).not.toContain(admin.secret);
  });

  it('rejects a wrong enrollment code', async () => {
    const admin = await makeAdmin();
    const login = await loginWithPassword(db(), { email: admin.email, password: admin.password }, ctx);
    if (!login.ok) throw new Error();
    await beginTotpEnrollment(db(), admin.id);
    const result = await confirmTotpEnrollment(db(), await sessionFor(login.token), '000000', ctx);
    expect(result.ok).toBe(false);
  });

  it('requires the second factor on the next sign-in and blocks code replay', async () => {
    const admin = await enrolledAdmin();
    const login = await loginWithPassword(db(), { email: admin.email, password: admin.password }, ctx);
    expect(login.ok && login.step).toBe('verify-2fa');
    if (!login.ok) return;
    const pending = await sessionFor(login.token);

    // Enrollment consumed the current step, so the same code can't be reused.
    expect((await verifySecondFactor(db(), pending, totpCode(admin.secret), ctx)).ok).toBe(false);

    const next = totpCode(admin.secret, 1);
    const ok = await verifySecondFactor(db(), pending, next, ctx);
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    // The pending session was rotated out; a new verified one replaces it.
    expect(await validateSessionToken(db(), login.token)).toBeNull();
    expect((await sessionFor(ok.token)).mfaVerifiedAt).not.toBeNull();

    // Replaying that code on another sign-in fails.
    const again = await loginWithPassword(db(), { email: admin.email, password: admin.password }, ctx);
    if (!again.ok) throw new Error();
    expect((await verifySecondFactor(db(), await sessionFor(again.token), next, ctx)).ok).toBe(false);
  });

  it('accepts a recovery code exactly once', async () => {
    const admin = await enrolledAdmin();
    const code = admin.recoveryCodes[3]!;
    const first = await loginWithPassword(db(), { email: admin.email, password: admin.password }, ctx);
    if (!first.ok) throw new Error();
    const used = await verifySecondFactor(db(), await sessionFor(first.token), code.toUpperCase(), ctx);
    expect(used.ok && used.usedRecoveryCode).toBe(true);

    const second = await loginWithPassword(db(), { email: admin.email, password: admin.password }, ctx);
    if (!second.ok) throw new Error();
    expect((await verifySecondFactor(db(), await sessionFor(second.token), code, ctx)).ok).toBe(false);
  });
});

describe('sessions', () => {
  it('expire after the idle timeout and are revoked when the user is disabled', async () => {
    const admin = await enrolledAdmin();
    const later = new Date(Date.now() + SESSION_POLICY.idleTtlMs + 60_000);
    expect(await validateSessionToken(db(), admin.token, later)).toBeNull();

    const fresh = await enrolledAdmin();
    const owner = await makeAdmin();
    await setUserStatus(db(), fresh.id, 'DISABLED', { adminId: owner.id, ipHash: null });
    expect(await validateSessionToken(db(), fresh.token)).toBeNull();
    const rows = await db().select().from(adminSessions).where(eq(adminSessions.userId, fresh.id));
    expect(rows.every((r) => r.revokedAt)).toBe(true);
  });

  it('changing the password signs out other sessions and clears the forced-change flag', async () => {
    const admin = await enrolledAdmin();
    const current = await sessionFor(admin.token);
    const otherLogin = await loginWithPassword(db(), { email: admin.email, password: admin.password }, ctx);
    if (!otherLogin.ok) throw new Error();

    expect(await changePassword(db(), current, { current: 'nope', next: 'Another good phrase 1' }, ctx)).toEqual({
      ok: false,
      error: 'wrongCurrent',
    });
    expect(await changePassword(db(), current, { current: admin.password, next: 'short' }, ctx)).toEqual({
      ok: false,
      error: 'tooShort',
    });
    expect(await changePassword(db(), current, { current: admin.password, next: 'Another good phrase 1' }, ctx)).toEqual({
      ok: true,
    });

    expect(await validateSessionToken(db(), otherLogin.token)).toBeNull();
    const still = await validateSessionToken(db(), admin.token);
    expect(still?.user.mustChangePassword).toBe(false);
  });
});

describe('audit trail for sign-in', () => {
  it('records login and 2FA events without secrets', async () => {
    const admin = await enrolledAdmin();
    const rows = await db().select().from(auditLogs).where(eq(auditLogs.objectId, admin.id));
    const actions = rows.map((r) => r.action);
    expect(actions).toEqual(expect.arrayContaining(['admin_user.created', 'auth.password_accepted', 'auth.2fa_enabled']));
    expect(JSON.stringify(rows)).not.toContain(admin.password);
    expect(JSON.stringify(rows)).not.toContain(admin.secret);
  });
});

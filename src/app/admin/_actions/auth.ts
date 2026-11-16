'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requestContext } from '@/server/auth/request-context';
import { changePassword, confirmTotpEnrollment, loginWithPassword, logout, verifySecondFactor } from '@/server/auth/service';
import { clearDeviceCookie, clearSessionCookie, deviceCookie, getCurrentAdmin, setDeviceCookie, setSessionCookie } from '@/server/auth/current';
import { forgetDevice, forgetUserDevices } from '@/server/auth/trusted-device';
import { recordAudit } from '@/server/audit/audit';
import { revalidatePath } from 'next/cache';
import { AUTH_STEP_PATHS, requireAdmin } from '@/server/auth/guard';
import type { ActionState } from './state';

const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(256) });

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: form.get('email'), password: form.get('password') });
  if (!parsed.success) return { error: 'login.invalid' };
  const result = await loginWithPassword(db(), { ...parsed.data, deviceToken: await deviceCookie() }, await requestContext());
  if (!result.ok) return { error: `login.${result.error}` };
  await setSessionCookie(result.token, { mfaVerified: result.mfaVerified });
  redirect(AUTH_STEP_PATHS[result.step]);
}

const codeSchema = z.string().trim().min(6).max(20);

export async function verifyAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { session } = await requireAdmin({ steps: ['verify-2fa'] });
  const code = codeSchema.safeParse(form.get('code'));
  if (!code.success) return { error: 'verify.invalid' };
  const result = await verifySecondFactor(db(), session, code.data, await requestContext(), { remember: form.get('remember') === 'on' });
  if (!result.ok) return { error: result.error === 'rateLimited' ? 'verify.rateLimited' : 'verify.invalid' };
  await setSessionCookie(result.token, { mfaVerified: true });
  if (result.deviceToken) await setDeviceCookie(result.deviceToken);
  redirect(`${AUTH_STEP_PATHS[result.step]}${result.usedRecoveryCode ? '?recovery=1' : ''}`);
}

export async function confirmTwoFactorAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { session } = await requireAdmin({ steps: ['setup-2fa'] });
  const code = codeSchema.safeParse(form.get('code'));
  if (!code.success) return { error: 'setup2fa.invalid' };
  const result = await confirmTotpEnrollment(db(), session, code.data, await requestContext());
  if (!result.ok) return { error: result.error === 'rateLimited' ? 'verify.rateLimited' : 'setup2fa.invalid' };
  await setSessionCookie(result.token, { mfaVerified: true });
  // Recovery codes are returned once to be displayed; they are never stored in plain text.
  return { ok: true, secrets: result.recoveryCodes, next: AUTH_STEP_PATHS[result.step] };
}

const passwordSchema = z.object({
  current: z.string().min(1).max(256),
  next: z.string().min(1).max(256),
  confirm: z.string().min(1).max(256),
});

export async function changePasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { session, user } = await requireAdmin({ steps: ['change-password', 'ok'] });
  const parsed = passwordSchema.safeParse({
    current: form.get('current'),
    next: form.get('next'),
    confirm: form.get('confirm'),
  });
  if (!parsed.success) return { error: 'users.errors.invalid' };
  if (parsed.data.next !== parsed.data.confirm) return { error: 'password.mismatch' };
  const result = await changePassword(db(), session, parsed.data, await requestContext());
  if (!result.ok) return { error: `password.${result.error}` };
  if (user.mustChangePassword) redirect('/admin');
  return { ok: true, message: 'password.saved' };
}

/** Forgets one of the signed-in admin's remembered devices, or all of them (`all`). */
export async function forgetDeviceAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const all = form.get('all') === '1';
  const id = z.uuid().safeParse(form.get('id'));
  if (!all && !id.success) return { error: 'users.errors.invalid' };
  const ctx = await requestContext();
  const gone = await db().transaction(async (tx) => {
    const n = all ? await forgetUserDevices(tx, user.id) : Number(await forgetDevice(tx, user.id, id.data!));
    if (n)
      await recordAudit(tx, {
        actorType: 'ADMIN',
        actorAdminId: user.id,
        action: all ? 'auth.devices_forgotten' : 'auth.device_forgotten',
        objectType: 'admin_user',
        objectId: user.id,
        ipHash: ctx.ipHash,
      });
    return n;
  });
  if (all) await clearDeviceCookie();
  revalidatePath('/admin/account/devices');
  return gone ? { ok: true, message: 'devices.forgotten' } : { error: 'users.errors.invalid' };
}

export async function logoutAction(): Promise<void> {
  const current = await getCurrentAdmin();
  if (current) await logout(db(), current.session, await requestContext());
  await clearSessionCookie();
  redirect('/admin/login');
}

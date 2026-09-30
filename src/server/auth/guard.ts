import 'server-only';
import { redirect } from 'next/navigation';
import { can } from '@/server/rbac/authz';
import type { Permission } from '@/server/rbac/permissions';
import { getCurrentAdmin, type CurrentAdmin } from './current';
import { nextAuthStep, type AuthStep } from './session';

export const AUTH_STEP_PATHS: Record<AuthStep, string> = {
  'verify-2fa': '/admin/login/verify',
  'setup-2fa': '/admin/account/two-factor',
  'change-password': '/admin/account/password',
  ok: '/admin',
};

/**
 * Every admin page and server action calls this. By default it requires a
 * fully verified session (password + 2FA, no pending password change);
 * `steps` widens that for the sign-in flow screens themselves.
 */
export async function requireAdmin(
  opts: { permission?: Permission; steps?: AuthStep[] } = {},
): Promise<CurrentAdmin> {
  const current = await getCurrentAdmin();
  if (!current) redirect('/admin/login');
  const step = nextAuthStep(current.user, current.session);
  const allowed = opts.steps ?? ['ok'];
  if (!allowed.includes(step)) redirect(AUTH_STEP_PATHS[step]);
  if (opts.permission && !can(current.authz, opts.permission)) redirect('/admin/forbidden');
  return current;
}

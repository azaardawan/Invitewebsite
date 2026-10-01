import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { db } from '@/server/db/client';
import { loadAuthz, type Authz } from '@/server/rbac/authz';
import { env } from '@/server/env';

/** Any https deployment (staging included) gets Secure, `__Secure-` cookies; local http development can't. */
const secureCookies = () => env().APP_URL.startsWith('https://');
import { validateSessionToken, SESSION_POLICY, type AdminUserRecord, type SessionRecord } from './session';

/**
 * The admin cookie is scoped to `/admin`, so storefront and invitation
 * requests never carry it. `__Secure-` requires HTTPS, so it is used on https deployments only.
 */
export function sessionCookieName() {
  return secureCookies() ? '__Secure-bahja_admin' : 'bahja_admin';
}

export async function setSessionCookie(token: string, opts: { mfaVerified: boolean }) {
  (await cookies()).set(sessionCookieName(), token, {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: 'strict',
    path: '/admin',
    maxAge: Math.floor((opts.mfaVerified ? SESSION_POLICY.absoluteTtlMs : SESSION_POLICY.pendingTtlMs) / 1000),
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete({ name: sessionCookieName(), path: '/admin' });
}

export type CurrentAdmin = { session: SessionRecord; user: AdminUserRecord; authz: Authz };

/** The signed-in admin for this request (memoized per request), or null. */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token) return null;
  const valid = await validateSessionToken(db(), token);
  if (!valid) return null;
  return { ...valid, authz: await loadAuthz(db(), valid.user.id) };
});

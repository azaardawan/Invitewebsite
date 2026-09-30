import 'server-only';
import { env } from '@/server/env';

/**
 * CSRF protection for route handlers (server actions get Next's built-in
 * origin check). State-changing requests must come from our own pages.
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get('origin');
  if (!origin) return false;
  try {
    const o = new URL(origin);
    return o.origin === new URL(env().APP_URL).origin || o.host === headers.get('host');
  } catch {
    return false;
  }
}

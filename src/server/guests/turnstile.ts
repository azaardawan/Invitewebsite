import 'server-only';
import { env } from '@/server/env';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function turnstileEnabled() {
  return Boolean(env().TURNSTILE_SECRET_KEY);
}

/**
 * Checks a Turnstile token with Cloudflare. Off (always true) when no keys are
 * configured. Fails closed if Cloudflare can't be reached: a guest can retry.
 */
export async function verifyTurnstile(
  token: string | undefined,
  { secret = env().TURNSTILE_SECRET_KEY, fetcher = fetch }: { secret?: string; fetcher?: typeof fetch } = {},
): Promise<boolean> {
  if (!secret) return true;
  if (!token || token.length > 2048) return false;
  try {
    const res = await fetcher(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

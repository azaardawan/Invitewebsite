'use server';

import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requestContext } from '@/server/auth/request-context';
import { env } from '@/server/env';
import { submitGuestResponse } from '@/server/guests/responses';
import { verifyTurnstile } from '@/server/guests/turnstile';
import type { GuestResponseInput, GuestSubmitResult } from '@/theme-sdk/types';

/** Random per-device token: lets a guest correct their answer without creating a duplicate. */
const GUEST_COOKIE = 'bahja_guest';

const inputSchema = z.object({
  name: z.string().max(500),
  attendance: z.enum(['ATTENDING', 'NOT_ATTENDING']).nullable(),
  message: z.string().max(5000).optional(),
});

/** Public guest form submission, bound to one invitation id by the invitation page. */
export async function submitGuestAction(invitationId: string, raw: GuestResponseInput, captchaToken?: string): Promise<GuestSubmitResult> {
  const id = z.uuid().safeParse(invitationId);
  const response = inputSchema.safeParse(raw);
  if (!id.success || !response.success) return { ok: false, error: 'invalid' };
  try {
    if (!(await verifyTurnstile(typeof captchaToken === 'string' ? captchaToken : undefined))) return { ok: false, error: 'invalid' };
    const jar = await cookies();
    let clientToken = jar.get(GUEST_COOKIE)?.value ?? '';
    if (!/^[A-Za-z0-9_-]{32}$/.test(clientToken)) {
      clientToken = randomBytes(24).toString('base64url');
      jar.set(GUEST_COOKIE, clientToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env().APP_URL.startsWith('https://'),
        path: '/',
        maxAge: 365 * 86400,
      });
    }
    const { ipHash } = await requestContext();
    return await submitGuestResponse(db(), { invitationId: id.data, response: response.data, ipHash, clientToken });
  } catch {
    return { ok: false, error: 'failed' };
  }
}

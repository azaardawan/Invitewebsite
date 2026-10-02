import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { invitations, themes } from '@/server/db/schema';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { consumeRateLimit } from '@/server/rate-limit';
import { env } from '@/server/env';
import { CLIENT_EVENTS, deviceClass, isBot, referrerHost, trackEvent } from '@/server/analytics/events';
import { PUBLIC_ID_PATTERN } from '@/lib/ids';

const body = z.object({
  n: z.enum(CLIENT_EVENTS),
  s: z.string().regex(/^[A-Za-z0-9_-]{8,40}$/),
  l: z.enum(['ar', 'en', 'ckb', 'bdn']).optional(),
  r: z.string().max(500).optional(),
  t: z.string().regex(/^[a-z0-9-]{1,60}$/).optional(),
  i: z.string().regex(PUBLIC_ID_PATTERN).optional(),
});

/**
 * Anonymous page-view beacon (navigator.sendBeacon). Always answers 204 so it never shows errors to
 * visitors; invalid, bot or over-limit requests are simply not recorded.
 */
export async function POST(req: Request) {
  const ua = req.headers.get('user-agent');
  if (isBot(ua)) return new Response(null, { status: 204 });
  const ipHash = hashIp(clientIpFrom(req.headers));
  if (ipHash && !(await consumeRateLimit(db(), `analytics:ip:${ipHash}`, 600, 3600))) return new Response(null, { status: 204 });
  let parsed: z.infer<typeof body>;
  try {
    const raw = await req.text();
    if (raw.length > 2000) return new Response(null, { status: 204 });
    const r = body.safeParse(JSON.parse(raw));
    if (!r.success) return new Response(null, { status: 204 });
    parsed = r.data;
  } catch {
    return new Response(null, { status: 204 });
  }

  let themeId: string | null = null;
  let invitationId: string | null = null;
  if (parsed.t) [{ id: themeId } = { id: null }] = await db().select({ id: themes.id }).from(themes).where(eq(themes.key, parsed.t)).limit(1);
  if (parsed.i) {
    [{ id: invitationId } = { id: null }] = await db().select({ id: invitations.id }).from(invitations).where(eq(invitations.publicId, parsed.i)).limit(1);
    if (!invitationId) return new Response(null, { status: 204 });
  }
  const ownHost = new URL(env().APP_URL).hostname;
  await trackEvent(db(), {
    name: parsed.n,
    sessionId: parsed.s,
    locale: parsed.l ?? null,
    deviceClass: deviceClass(ua),
    referrerHost: referrerHost(parsed.r, ownHost),
    themeId,
    invitationId,
  });
  return new Response(null, { status: 204 });
}

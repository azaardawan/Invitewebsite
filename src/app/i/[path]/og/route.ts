import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { consumeRateLimit, rateLimited } from '@/server/rate-limit';
import { resolvePublicInvitation } from '@/server/invitation/public';
import { ensurePreview } from '@/server/documents/documents';

/**
 * The picture WhatsApp (and other apps) show when an invitation link is shared: the invitation's own
 * cover with the couple's names, 1200 × 630. Stored and redrawn only when what it shows changes.
 * Public like the invitation itself; only for live invitations.
 */
export async function GET(_req: Request, { params }: RouteContext<'/i/[path]/og'>) {
  const { path } = await params;
  // Same guard as the invitation page: misses are limited so ids can't be guessed through here.
  const ipHash = hashIp(clientIpFrom(await headers()));
  const missKey = ipHash ? `i-miss:${ipHash}` : null;
  if (missKey && (await rateLimited(db(), missKey, 30, 3600))) return new Response('Not found', { status: 404 });
  const r = await resolvePublicInvitation(path);
  if (r.state === 'missing' && missKey) await consumeRateLimit(db(), missKey, 30, 3600);
  if (r.state !== 'live') return new Response('Not found', { status: 404 });
  const image = await ensurePreview(db(), r.invitation.id, 'og').catch((e) => {
    console.error('[og] preview failed', e);
    return null;
  });
  if (!image) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(image), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=600', 'X-Robots-Tag': 'noindex' },
  });
}

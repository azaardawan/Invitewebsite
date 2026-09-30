import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { consumeRateLimit } from '@/server/rate-limit';
import { handleWaylWebhook } from '@/server/payments/service';

const MAX_BODY = 64 * 1024;

/**
 * WAYL payment notifications. The raw body is stored and the payment is then
 * re-verified with WAYL's API; the delivery itself is never trusted.
 */
export async function POST(req: Request) {
  const ipHash = hashIp(clientIpFrom(req.headers));
  if (ipHash && !(await consumeRateLimit(db(), `wayl-webhook:${ipHash}`, 600, 3600))) {
    return Response.json({ ok: false }, { status: 429 });
  }
  const raw = Buffer.from(await req.arrayBuffer());
  if (raw.length === 0 || raw.length > MAX_BODY) return Response.json({ ok: false }, { status: 400 });
  const signature = req.headers.get('x-wayl-signature-256') ?? req.headers.get('x-wayl-signature');
  const result = await handleWaylWebhook(db(), raw, signature);
  return Response.json({ ok: true, outcome: result.outcome });
}

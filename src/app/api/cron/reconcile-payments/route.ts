import { db } from '@/server/db/client';
import { env } from '@/server/env';
import { safeEqual } from '@/lib/crypto';
import { reconcilePayments } from '@/server/payments/service';

/**
 * Scheduled safety net (every ~10 minutes): re-checks open payments with WAYL
 * and expires unpaid orders past their window. Called with
 * `Authorization: Bearer <CRON_SECRET>`.
 */
export async function POST(req: Request) {
  const secret = env().CRON_SECRET;
  const given = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!secret || !safeEqual(given, secret)) return Response.json({ ok: false }, { status: 401 });
  return Response.json({ ok: true, ...(await reconcilePayments(db())) });
}

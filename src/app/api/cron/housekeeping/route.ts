import { db } from '@/server/db/client';
import { env } from '@/server/env';
import { safeEqual } from '@/lib/crypto';
import { runHousekeeping } from '@/server/housekeeping';

/**
 * Daily cleanup (also runs automatically inside the web process, see src/instrumentation.ts).
 * Manual trigger: `POST` with `Authorization: Bearer <CRON_SECRET>`.
 */
export async function POST(req: Request) {
  const secret = env().CRON_SECRET;
  const given = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!secret || !safeEqual(given, secret)) return Response.json({ ok: false }, { status: 401 });
  return Response.json({ ok: true, ...(await runHousekeeping(db())) });
}

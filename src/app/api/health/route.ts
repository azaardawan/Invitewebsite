import { sql } from 'drizzle-orm';
import { db } from '@/server/db/client';

/** Liveness + database check for the host's health probe. Reveals nothing else. */
export async function GET() {
  try {
    await db().execute(sql`select 1`);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { assets, invitations, themeVersions } from '@/server/db/schema';
import { env } from '@/server/env';
import { publicMediaUrl, storage } from '@/server/storage';
import { sha256Buffer } from '@/lib/crypto';

/**
 * The couple's own opening film (owner, 2026-11-25; designs with manifest `film`, e.g. Golden Stitch): the invite
 * renderer (renderer/, its own Railway service, reached over the private network) stitches their names, initials and
 * date on linen. Made after payment, made again when the names or date change, about ten minutes each time.
 *
 * `syncFilms` runs every minute from the scheduler (and right after a payment): it asks the renderer for the films that
 * are missing or out of date, checks on the ones being made, and stores each finished MP4 (S3 in production) as the
 * invitation's `film_asset_id`. Everything is idempotent: a restart, a second replica or a renderer redeploy (which
 * forgets its jobs) only repeats harmless work. After three failures for the same names it stops (the team sees them
 * in the logs); new names start again.
 */

type InvitationRow = typeof invitations.$inferSelect;

/** What the renderer is asked to draw. */
export type FilmInputs = { names: string; initials: string; date: string };

export const MAX_FILM_TRIES = 3;
/** Jobs started per run, so a burst of orders doesn't fill the renderer's queue (it keeps 20). */
const MAX_NEW_JOBS = 5;

/** The film's texts from the invitation's fields; null when there is nothing to stitch (no names or no date). */
export function filmInputs(values: Readonly<Record<string, unknown>>): FilmInputs | null {
  const text = (k: string) => (typeof values[k] === 'string' ? (values[k] as string).replace(/\s+/g, ' ').trim() : '');
  const one = text('person_1_name');
  const two = text('person_2_name');
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text('event_date'));
  if (!(one || two) || !date) return null;
  // Names may hold "&" themselves: the renderer splits on it, so never send one of the customer's.
  const clean = (s: string) => s.replace(/[&|]/g, ' ').replace(/\s+/g, ' ').trim();
  const names = [clean(one), clean(two)].filter(Boolean);
  const initial = (s: string) => Array.from(s)[0]?.toLocaleUpperCase('en') ?? '';
  return {
    names: names.join(' & '),
    initials: names.map(initial).join(' | '),
    date: `${date[3]}.${date[2]}.${date[1]}`,
  };
}

/** The film's identity: a new one is made whenever this changes. */
export function filmKey(inputs: FilmInputs): string {
  return JSON.stringify([inputs.names, inputs.initials, inputs.date]);
}

/** The film's address for the online invitation, or null while there is none. */
export async function filmSrc(db: DbOrTx, inv: Pick<InvitationRow, 'filmAssetId'>): Promise<string | null> {
  if (!inv.filmAssetId) return null;
  const [a] = await db.select({ key: assets.storageKey }).from(assets).where(eq(assets.id, inv.filmAssetId));
  return a ? publicMediaUrl(a.key) : null;
}

function film(): { url: string; key: string } | null {
  const e = env();
  return e.RENDERER_URL && e.RENDER_API_KEY ? { url: e.RENDERER_URL.replace(/\/$/, ''), key: e.RENDER_API_KEY } : null;
}

function log(level: 'info' | 'error', msg: string, extra: Record<string, unknown> = {}) {
  const line = JSON.stringify({ level, msg: `film.${msg}`, ...extra });
  if (level === 'error') console.error(line);
  else console.log(line);
}

type Fetch = typeof fetch;

/** Runs one round. `fetchImpl` is for tests. */
export async function syncFilms(db: DbOrTx, fetchImpl: Fetch = fetch): Promise<{ started: number; finished: number; failed: number }> {
  const renderer = film();
  const result = { started: 0, finished: 0, failed: 0 };
  if (!renderer) return result;

  // Paid invitations of designs with a film (as stored with the invitation's exact design version).
  const rows = await db
    .select({ inv: invitations })
    .from(invitations)
    .innerJoin(themeVersions, eq(themeVersions.id, invitations.themeVersionId))
    .where(and(sql`(${themeVersions.manifest} ->> 'film') = 'true'`, inArray(invitations.status, ['PAID', 'PUBLISHED'])));

  const call = async (path: string, init: RequestInit = {}) =>
    fetchImpl(`${renderer.url}${path}`, {
      ...init,
      headers: { 'X-API-Key': renderer.key, ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
      signal: AbortSignal.timeout(120_000),
    });

  let newJobs = 0;
  for (const { inv } of rows) {
    const inputs = filmInputs(inv.fieldValues as Record<string, unknown>);
    const want = inputs ? filmKey(inputs) : null;
    try {
      if (inv.filmJobId) {
        // A film is being made: check on it.
        const res = await call(`/jobs/${encodeURIComponent(inv.filmJobId)}`);
        const job = res.ok ? ((await res.json()) as { status: string; error?: unknown }) : null;
        if (job?.status === 'queued' || job?.status === 'rendering') continue;
        if (job?.status === 'done') {
          const video = await call(`/jobs/${encodeURIComponent(inv.filmJobId)}/video`);
          if (!video.ok) throw new Error(`video download: HTTP ${video.status}`);
          const data = Buffer.from(await video.arrayBuffer());
          await storeFilm(db, inv, data);
          result.finished++;
          log('info', 'finished', { invitationId: inv.id, bytes: data.byteLength });
          continue;
        }
        // Failed, or forgotten (the renderer restarted): try again on the next round.
        await db
          .update(invitations)
          // `film_job_for` stays: it says which names the failures counted in `film_tries` were for.
          .set({ filmJobId: null, filmTries: inv.filmTries + 1 })
          .where(and(eq(invitations.id, inv.id), eq(invitations.filmJobId, inv.filmJobId)));
        result.failed++;
        log('error', 'failed', { invitationId: inv.id, status: res.status, job });
        continue;
      }
      if (!inputs || !want || want === inv.filmFor) continue;
      // New names: three fresh tries (the stored count belongs to the names that failed).
      if (inv.filmTries >= MAX_FILM_TRIES && inv.filmJobFor === want) continue;
      if (newJobs >= MAX_NEW_JOBS) continue;
      const res = await call('/jobs', { method: 'POST', body: JSON.stringify(inputs) });
      if (res.status === 429) break; // the renderer's queue is full: the next round tries again
      if (!res.ok) throw new Error(`job request: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
      const job = (await res.json()) as { id: string };
      await db
        .update(invitations)
        .set({ filmJobId: job.id, filmJobFor: want, ...(inv.filmJobFor !== want ? { filmTries: 0 } : {}) })
        .where(eq(invitations.id, inv.id));
      newJobs++;
      result.started++;
      log('info', 'started', { invitationId: inv.id, job: job.id });
    } catch (e) {
      result.failed++;
      log('error', 'error', { invitationId: inv.id, error: String(e) });
    }
  }
  return result;
}

/** Saves a finished film and makes it the invitation's (only if it is still for the same names and date). */
async function storeFilm(db: DbOrTx, inv: InvitationRow, data: Buffer) {
  const key = `videos/${randomUUID()}.mp4`;
  await storage().put(key, data, 'video/mp4');
  const [asset] = await db
    .insert(assets)
    .values({ kind: 'VIDEO', storageKey: key, mime: 'video/mp4', bytes: data.byteLength, width: 720, height: 1280, durationSeconds: 12, sha256: sha256Buffer(data), originalFilename: 'film', uploadedBy: null })
    .returning();
  const [row] = await db
    .update(invitations)
    .set({ filmAssetId: asset!.id, filmFor: inv.filmJobFor, filmJobId: null, filmJobFor: null, filmTries: 0 })
    .where(and(eq(invitations.id, inv.id), eq(invitations.filmJobId, inv.filmJobId!)))
    .returning({ id: invitations.id });
  if (!row) {
    // Someone else stored it first: drop this copy.
    await deleteFilmAssets(db, [asset!.id]);
    return;
  }
  if (inv.filmAssetId) await deleteFilmAssets(db, [inv.filmAssetId]);
}

async function deleteFilmAssets(db: DbOrTx, ids: string[]) {
  if (!ids.length) return;
  const rows = await db.delete(assets).where(inArray(assets.id, ids)).returning({ key: assets.storageKey });
  for (const r of rows) await storage().delete(r.key).catch(() => {});
}

/** Housekeeping: the films of these invitations (personal data: the couple's names), deleted with their photos. */
export async function deleteFilmsOf(db: DbOrTx, invitationIds: string[]): Promise<number> {
  if (!invitationIds.length) return 0;
  const rows = await db
    .select({ id: invitations.id, film: invitations.filmAssetId })
    .from(invitations)
    .where(and(inArray(invitations.id, invitationIds), isNotNull(invitations.filmAssetId)));
  if (!rows.length) return 0;
  await db
    .update(invitations)
    .set({ filmAssetId: null, filmFor: null, filmJobId: null, filmJobFor: null })
    .where(inArray(invitations.id, rows.map((r) => r.id)));
  await deleteFilmAssets(db, rows.map((r) => r.film!));
  return rows.length;
}

import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

// The renderer is "configured" for this file only (env() is read lazily); every call goes to the fake below.
process.env.RENDERER_URL = 'http://renderer.test:8000';
process.env.RENDER_API_KEY = 'test-render-key';

import { db } from '@/server/db/client';
import { assets, invitations } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { MAX_FILM_TRIES, deleteFilmsOf, syncFilms } from '@/server/film/film';
import { invitationRenderData } from '@/server/invitation/load';
import { storage } from '@/server/storage';
import { randomToken } from '@/lib/crypto';
import { activeTheme, futureDate, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

type Shop = Awaited<ReturnType<typeof activeTheme>>;
let filmShop: Shop;
let plainShop: Shop;
beforeAll(async () => {
  filmShop = await activeTheme({ film: true });
  plainShop = await activeTheme();
});

async function paid(shop: Shop, values = weddingValues()) {
  const visitor = { ...ctx, ipHash: randomToken(8) };
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values }, visitor);
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
  await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  return d.invitationId;
}
const reload = async (id: string) => (await db().select().from(invitations).where(eq(invitations.id, id)))[0]!;

/** A stand-in renderer: records requests, answers from `jobs`. */
function fakeRenderer() {
  const calls: { method: string; path: string; body?: unknown; key: string | null }[] = [];
  const jobs = new Map<string, { status: string; request: unknown }>();
  let next = 0;
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = new URL(String(url));
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path: u.pathname, body, key: new Headers(init?.headers).get('x-api-key') });
    if (method === 'POST' && u.pathname === '/jobs') {
      const id = `job-${++next}`;
      jobs.set(id, { status: 'queued', request: body });
      return Response.json({ id, status: 'queued' }, { status: 202 });
    }
    const m = /^\/jobs\/([^/]+)(\/video)?$/.exec(u.pathname);
    const job = m ? jobs.get(m[1]!) : undefined;
    if (!job) return Response.json({ error: 'not found' }, { status: 404 });
    if (m![2]) return new Response(Buffer.from(`MP4 for ${JSON.stringify(job.request)}`), { headers: { 'Content-Type': 'video/mp4' } });
    return Response.json({ id: m![1], status: job.status });
  }) as typeof fetch;
  return { impl, calls, jobs };
}

describe("the couple's opening film", () => {
  it('is asked for after payment, collected when made, and shown only on the live invitation', async () => {
    const r = fakeRenderer();
    const day = futureDate(60);
    const id = await paid(filmShop, weddingValues({ person_1_name: 'Aza', person_2_name: 'Raghad', event_date: day }));
    const plain = await paid(plainShop);

    await syncFilms(db(), r.impl);
    let inv = await reload(id);
    expect(inv.filmJobId).toBe('job-1');
    const posts = r.calls.filter((c) => c.method === 'POST');
    expect(posts).toEqual([{ method: 'POST', path: '/jobs', body: { names: 'Aza & Raghad', initials: 'A | R', date: day.split('-').reverse().join('.') }, key: 'test-render-key' }]);
    // Designs without a film are never sent.
    expect((await reload(plain)).filmJobId).toBeNull();

    // Still being made: nothing changes, and no second job.
    r.jobs.get('job-1')!.status = 'rendering';
    await syncFilms(db(), r.impl);
    expect((await reload(id)).filmJobId).toBe('job-1');
    expect(r.calls.filter((c) => c.method === 'POST')).toHaveLength(1);
    expect((await invitationRenderData(db(), await reload(id), 'live')).props.film).toBeNull();

    // Done: stored and handed to the design.
    r.jobs.get('job-1')!.status = 'done';
    await syncFilms(db(), r.impl);
    inv = await reload(id);
    expect(inv.filmJobId).toBeNull();
    expect(inv.filmAssetId).not.toBeNull();
    const [asset] = await db().select().from(assets).where(eq(assets.id, inv.filmAssetId!));
    expect(asset!.storageKey).toMatch(/^videos\/.+\.mp4$/);
    expect((await storage().get(asset!.storageKey))?.toString()).toContain('Aza & Raghad');
    const live = await invitationRenderData(db(), inv, 'live');
    expect(live.props.film?.src).toContain(asset!.storageKey);
    expect((await invitationRenderData(db(), inv, 'preview')).props.film).toBeNull();

    // Nothing more to do until the names or date change.
    await syncFilms(db(), r.impl);
    expect(r.calls.filter((c) => c.method === 'POST')).toHaveLength(1);

    // The customer corrects a name: a new film; the old one is replaced once the new one is made.
    await db().update(invitations).set({ fieldValues: { ...inv.fieldValues, person_2_name: 'Raghd' } }).where(eq(invitations.id, id));
    await syncFilms(db(), r.impl);
    expect((await reload(id)).filmJobId).toBe('job-2');
    expect((await invitationRenderData(db(), await reload(id), 'live')).props.film?.src).toContain(asset!.storageKey);
    r.jobs.get('job-2')!.status = 'done';
    await syncFilms(db(), r.impl);
    inv = await reload(id);
    expect(inv.filmAssetId).not.toBe(asset!.id);
    expect(await db().select().from(assets).where(eq(assets.id, asset!.id))).toEqual([]);

    // Housekeeping deletes it with the couple's other personal files.
    const [current] = await db().select().from(assets).where(eq(assets.id, inv.filmAssetId!));
    expect(await deleteFilmsOf(db(), [id])).toBe(1);
    expect((await reload(id)).filmAssetId).toBeNull();
    expect(await storage().get(current!.storageKey)).toBeNull();
  });

  it('tries again when a render fails or the renderer forgot it, and stops after three failures', async () => {
    const r = fakeRenderer();
    const id = await paid(filmShop);
    for (let i = 0; i < MAX_FILM_TRIES; i++) {
      await syncFilms(db(), r.impl);
      const job = (await reload(id)).filmJobId!;
      expect(job).toBeTruthy();
      if (i === 0) r.jobs.get(job)!.status = 'failed';
      else r.jobs.delete(job); // a redeploy forgets its jobs
      await syncFilms(db(), r.impl);
    }
    const inv = await reload(id);
    expect(inv.filmTries).toBe(MAX_FILM_TRIES);
    expect(inv.filmJobId).toBeNull();
    const before = r.calls.filter((c) => c.method === 'POST').length;
    await syncFilms(db(), r.impl);
    expect(r.calls.filter((c) => c.method === 'POST')).toHaveLength(before);

    // New names start afresh.
    await db().update(invitations).set({ fieldValues: { ...inv.fieldValues, person_1_name: 'Omar' } }).where(eq(invitations.id, id));
    await syncFilms(db(), r.impl);
    expect((await reload(id)).filmJobId).toBeTruthy();
    expect((await reload(id)).filmTries).toBe(0);
  });
});

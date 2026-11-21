import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { assets, auditLogs, tours } from '@/server/db/schema';
import { CatalogError } from '@/server/catalog/common';
import { countTourVisit, createTour, isGlb, publicTour, setTourLive, setTourModel, setTourPrivacy, tourPath, tourState, updateTour, whatsappLink } from '@/server/tours/tours';
import { tourLocale } from '@/server/tours/locale';
import { mediaServedHere } from '@/server/storage/served-here';
import { storage } from '@/server/storage';
import { randomToken } from '@/lib/crypto';
import { makeAdmin } from '../helpers';

/** The smallest valid binary glTF: its header and an empty scene. */
function glb(): Buffer {
  const json = Buffer.from(JSON.stringify({ asset: { version: '2.0' }, scenes: [{ nodes: [] }], scene: 0 }).padEnd(48, ' '));
  const header = Buffer.alloc(12);
  const chunk = Buffer.alloc(8);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length, 8);
  chunk.writeUInt32LE(json.length, 0);
  chunk.write('JSON', 4, 'ascii');
  return Buffer.concat([header, chunk, json]);
}

async function onDisk(data: Buffer) {
  const dir = await mkdtemp(path.join(tmpdir(), 'tour-test-'));
  const file = path.join(dir, 'model.glb');
  await writeFile(file, data);
  return file;
}

let actor: { adminId: string; ipHash: null };
beforeAll(async () => {
  actor = { adminId: (await makeAdmin()).id, ipHash: null };
});
const slug = () => `cafe-${randomToken(6).toLowerCase().replace(/[^a-z0-9]/g, 'x')}`;

describe('virtual tours', () => {
  it('creates a tour, audited, with only its filled links; link names are checked and unique', async () => {
    const s = slug();
    const t = await createTour(db(), { name: ' Café Roma ', slug: s.toUpperCase(), links: { instagram: 'https://instagram.com/roma', menu: '', whatsapp: '+964 770 123 4567' } }, actor);
    expect(t.slug).toBe(s);
    expect(t.name).toBe('Café Roma');
    expect(t.links).toEqual({ instagram: 'https://instagram.com/roma', whatsapp: '+964 770 123 4567' });
    expect(t.live).toBe(false);
    const audit = await db().select().from(auditLogs).where(eq(auditLogs.objectId, t.id));
    expect(audit.map((a) => a.action)).toContain('tour.created');

    await expect(createTour(db(), { name: 'Other', slug: s, links: {} }, actor)).rejects.toMatchObject({ code: 'slugTaken' });
    for (const bad of ['a b', 'ca', '-cafe', 'café', 'cafe--x']) {
      await expect(createTour(db(), { name: 'X', slug: bad, links: {} }, actor)).rejects.toBeInstanceOf(CatalogError);
    }
    await expect(createTour(db(), { name: 'X', slug: slug(), links: { menu: 'http://insecure.example' } }, actor)).rejects.toMatchObject({ code: 'invalidTour' });
  });

  it('accepts only .glb models, and shows a tour only when it is on, has its model and has not ended', async () => {
    const s = slug();
    const t = await createTour(db(), { name: 'Bayt Café', slug: s, links: { whatsapp: '07701234567' } }, actor);
    expect((await publicTour(db(), s)).state).toBe('off');
    await expect(setTourLive(db(), t.id, true, actor)).rejects.toMatchObject({ code: 'noModel' });

    await expect(setTourModel(db(), t.id, await onDisk(Buffer.from('not a model at all, sorry')), actor)).rejects.toMatchObject({ code: 'notGlb' });
    expect(isGlb(glb())).toBe(true);
    const cut = glb().subarray(0, 40);
    expect(isGlb(cut)).toBe(false);

    await setTourModel(db(), t.id, await onDisk(glb()), actor, 'bayt.glb');
    const [withModel] = await db().select().from(tours).where(eq(tours.id, t.id));
    const [asset] = await db().select().from(assets).where(eq(assets.id, withModel!.modelAssetId!));
    expect(asset!.kind).toBe('MODEL');
    expect(asset!.storageKey).toMatch(/^tours\/.+\.glb$/);
    expect(mediaServedHere(asset!.storageKey, 's3')).toBe('model/gltf-binary');
    expect(mediaServedHere('other/x.glb', 'local')).toBeNull();

    // A new model replaces the old one, whose file goes.
    await setTourModel(db(), t.id, await onDisk(glb()), actor);
    expect(await db().select().from(assets).where(eq(assets.id, asset!.id))).toHaveLength(0);
    expect(await storage().get(asset!.storageKey).catch(() => null)).toBeNull();

    await setTourLive(db(), t.id, true, actor);
    const live = await publicTour(db(), s);
    expect(live.state).toBe('live');
    if (live.state !== 'live') return;
    expect(live.tour.model).toMatch(/^\/media\/tours\/.+\.glb$/);
    expect(live.tour.links.whatsapp).toBe('https://wa.me/07701234567');

    await countTourVisit(db(), t.id);
    await countTourVisit(db(), t.id);
    expect((await db().select().from(tours).where(eq(tours.id, t.id)))[0]!.visits).toBe(2);

    // The subscription's end: shown through that day (Baghdad), ended after it.
    await updateTour(db(), t.id, { name: 'Bayt Café', slug: s, links: {}, endsOn: '2026-12-31' }, actor);
    expect((await publicTour(db(), s, new Date('2026-12-31T20:00:00Z'))).state).toBe('live');
    expect((await publicTour(db(), s, new Date('2026-12-31T21:00:00Z'))).state).toBe('ended');

    await setTourLive(db(), t.id, false, actor);
    expect((await publicTour(db(), s, new Date('2026-12-01T00:00:00Z'))).state).toBe('off');
    expect((await publicTour(db(), 'no-such-cafe-here')).state).toBe('missing');
    expect((await publicTour(db(), '../etc')).state).toBe('missing');
  });

  it('a private link opens the tour only with its code; a new code ends the old link', async () => {
    const s = slug();
    const t = await createTour(db(), { name: 'Secret Café', slug: s, links: {}, private: true }, actor);
    expect(t.privateKey).toMatch(/^[a-z0-9]{16}$/);
    const link = tourPath(t);
    expect(link).toBe(`/tour/${s}-${t.privateKey}`);
    const at = (path: string) => publicTour(db(), path.replace('/tour/', ''));
    expect((await at(link)).state).toBe('off');
    expect((await at(`/tour/${s}`)).state).toBe('missing');
    expect((await at(`/tour/${s}-${'a'.repeat(16)}`)).state).toBe('missing');
    expect((await at(`${link}x`)).state).toBe('missing');

    const renewed = await setTourPrivacy(db(), t.id, 'renew', actor);
    expect(renewed.privateKey).not.toBe(t.privateKey);
    expect((await at(link)).state).toBe('missing');
    expect((await at(tourPath(renewed))).state).toBe('off');
    // Asking for private again keeps the code.
    expect((await setTourPrivacy(db(), t.id, 'private', actor)).privateKey).toBe(renewed.privateKey);

    const open = await setTourPrivacy(db(), t.id, 'public', actor);
    expect(tourPath(open)).toBe(`/tour/${s}`);
    expect((await at(`/tour/${s}`)).state).toBe('off');
    expect((await at(tourPath(renewed))).state).toBe('missing');
    // The code is never written in the audit log.
    const audit = await db().select().from(auditLogs).where(eq(auditLogs.objectId, t.id));
    expect(audit.map((a) => a.action)).toEqual(expect.arrayContaining(['tour.created', 'tour.link_renewed', 'tour.link_public']));
    expect(JSON.stringify(audit)).not.toContain(renewed.privateKey!);
  });

  it('reads the state, WhatsApp links and the page language', () => {
    expect(tourState({ live: true, modelAssetId: 'x', endsAt: null })).toBe('live');
    expect(tourState({ live: true, modelAssetId: null, endsAt: null })).toBe('off');
    expect(tourState({ live: true, modelAssetId: 'x', endsAt: new Date(Date.now() - 1000) })).toBe('ended');
    expect(whatsappLink('')).toBeUndefined();
    expect(whatsappLink('+964 (770) 123-4567')).toBe('https://wa.me/9647701234567');
    expect(tourLocale(null)).toBe('ar');
    expect(tourLocale('en-US,en;q=0.9')).toBe('en');
    expect(tourLocale('ku;q=0.9,en;q=0.5')).toBe('ckb');
    expect(tourLocale('kmr,ar;q=0.5')).toBe('bdn');
    expect(tourLocale('fr-FR,de;q=0.8')).toBe('ar');
  });
});

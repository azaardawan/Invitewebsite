import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { assets, auditLogs, invitations, themes } from '@/server/db/schema';
import { storage } from '@/server/storage';
import { syncThemesFromRegistry, transitionTheme, updateThemeSettings } from '@/server/catalog/themes';
import { createPackage } from '@/server/catalog/packages';
import { storeImage } from '@/server/media/assets';
import { createDraft } from '@/server/orders/drafts';
import { validateFieldValues } from '@/server/orders/validation';
import { fieldDefs } from '@/server/orders/common';
import { invitationRenderData } from '@/server/invitation/load';
import { listPhotos, photoSpec, setPhoto } from '@/server/photos/photos';
import { setTemplateText, TemplateTextError } from '@/server/template/text';
import { handleTemplateTextRequest } from '@/server/template/http';
import { customerVideo, removeVideo, setVideo } from '@/server/video/video';
import { processVideo, VIDEO_MAX_SECONDS } from '@/server/media/video';
import { spacedPhone } from '@/server/products/data';
import { randomToken } from '@/lib/crypto';
import { activeTheme, testManifest } from '../fixtures';
import { ctx, uniqueKey } from '../helpers';

/** Couples (owner, 2026-10-31): a template design filled in place, with photos (as many as the package sells) and one video. */
const FIELDS = ['person_1_name', 'person_2_name', 'invitation_message'] as const;
const dir = mkdtempSync(path.join(tmpdir(), 'bahja-couples-test-'));
let shop: { themeKey: string; nine: string; all: string; themeId: string; actor: { adminId: string; ipHash: null } };

function clip(name: string, seconds: number) {
  const file = path.join(dir, name);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `testsrc=size=1920x1080:rate=25:duration=${seconds}`, '-f', 'lavfi', '-i', `sine=frequency=440:duration=${seconds}`, '-shortest', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-metadata', 'location=+36.19+044.01/', file]);
  return file;
}

async function draft(packageId = shop.nine) {
  const d = await createDraft(db(), { themeKey: shop.themeKey, packageId, locale: 'en', values: {} }, { ...ctx, ipHash: randomToken(8) });
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
  return { ...d, inv: inv! };
}
const reload = async (id: string) => (await db().select().from(invitations).where(eq(invitations.id, id)))[0]!;

beforeAll(async () => {
  const base = await activeTheme();
  const key = uniqueKey('couples');
  await syncThemesFromRegistry(
    db(),
    [
      testManifest(key, 1, {
        sections: ['couples'],
        fields: [...FIELDS],
        features: ['photos', 'video'],
        editor: 'template',
        validStates: [{ features: ['photos', 'video'], fields: [...FIELDS] }],
        wording: [
          { key: 'title', label: { ar: 'العنوان', en: 'Title' }, ar: 'معاً إلى الأبد', versions: { en: 'Together Forever' }, defaultIn: ['en'], maxLength: 20 },
          { key: 'tag', label: { ar: 'المناسبة', en: 'Occasion' }, ar: 'ذكرى زواجنا', options: ['خطوبتنا'], custom: false, maxLength: 24 },
        ],
        photos: { max: 18, min: 1, aspect: 2 / 3 },
        print: undefined,
      }),
    ],
    base.actor,
    { complete: false },
  );
  const [t] = await db().select().from(themes).where(eq(themes.key, key));
  const cover = await storeImage(db(), await sharp({ create: { width: 331, height: 431, channels: 3, background: '#300' } }).png().toBuffer(), { uploadedBy: null });
  await updateThemeSettings(db(), t!.id, { name: t!.name, sectionId: t!.sectionId, coverAssetId: cover.id, musicTrackId: null }, base.actor);
  const nine = await createPackage(db(), t!.id, { name: { ar: 'تسع', en: 'Nine' }, priceIqd: 30000, fieldKeys: [...FIELDS], featureKeys: ['photos', 'video'], photoLimit: 9 }, base.actor);
  const all = await createPackage(db(), t!.id, { name: { ar: 'الكل', en: 'All' }, priceIqd: 50000, fieldKeys: [...FIELDS], featureKeys: ['photos', 'video'] }, base.actor);
  await transitionTheme(db(), t!.id, 'READY_FOR_REVIEW', base.actor);
  await transitionTheme(db(), t!.id, 'ACTIVE', base.actor);
  shop = { themeKey: key, nine: nine.id, all: all.id, themeId: t!.id, actor: base.actor as { adminId: string; ipHash: null } };
}, 60_000);

describe('packages sell a number of photos', () => {
  it('the package limit narrows the design’s places; empty means all of them', async () => {
    const nine = await draft(shop.nine);
    expect(nine.inv.photoLimit).toBe(9);
    expect((await photoSpec(db(), nine.inv))?.max).toBe(9);
    const all = await draft(shop.all);
    expect((await photoSpec(db(), all.inv))?.max).toBe(18);
    const { props } = await invitationRenderData(db(), nine.inv, 'preview');
    expect(props.photoPlaces).toBe(9);
  });

  it('a package cannot sell more photos than the design holds', async () => {
    await expect(
      createPackage(db(), shop.themeId, { name: { ar: 'كثير', en: 'Too many' }, priceIqd: 1000, fieldKeys: [...FIELDS], featureKeys: ['photos', 'video'], photoLimit: 19 }, shop.actor),
    ).rejects.toThrow();
  });
});

describe('template designs are filled in place', () => {
  it('the draft starts empty (no texts needed yet); an order-form design still needs them', async () => {
    const { inv } = await draft();
    expect(inv.fieldValues).toEqual({});
    const defs = await fieldDefs(db(), [...FIELDS]);
    expect(validateFieldValues({}, [...FIELDS], defs).ok).toBe(false);
    expect(validateFieldValues({}, [...FIELDS], defs, new Date(), { partial: true })).toEqual({ ok: true, values: {} });
  });

  it('texts are saved one by one, cleaned and checked; empty brings back the default', async () => {
    const { inv } = await draft();
    expect(await setTemplateText(db(), inv, 'field:person_1_name', '  Dara\u0007  ')).toBe('Dara');
    await setTemplateText(db(), inv, 'field:person_2_name', 'Ava');
    let row = await reload(inv.id);
    expect(row.fieldValues).toMatchObject({ person_1_name: 'Dara', person_2_name: 'Ava' });
    expect(row.slug).toContain('dara');
    // Cleared: gone again (checkout will ask for it).
    expect(await setTemplateText(db(), inv, 'field:person_2_name', '   ')).toBe('');
    row = await reload(inv.id);
    expect(row.fieldValues.person_2_name).toBeUndefined();

    expect(await setTemplateText(db(), inv, 'wording:title', 'Our Story')).toBe('Our Story');
    expect((await reload(inv.id)).wording.title).toBe('Our Story');
    expect(await setTemplateText(db(), inv, 'wording:title', '')).toBe('Together Forever');
    await expect(setTemplateText(db(), inv, 'wording:title', 'x'.repeat(21))).rejects.toMatchObject({ code: 'tooLong' });
    // A line without the customer's own words takes only its offered choices.
    await expect(setTemplateText(db(), inv, 'wording:tag', 'Anything')).rejects.toMatchObject({ code: 'invalidChoice' });
    expect(await setTemplateText(db(), inv, 'wording:tag', 'خطوبتنا')).toBe('خطوبتنا');
    // Keys the design does not have.
    for (const key of ['field:venue_name', 'wording:nope', 'title', 'photo:x:title']) {
      await expect(setTemplateText(db(), inv, key, 'x')).rejects.toBeInstanceOf(TemplateTextError);
    }
  });

  it('a photo gets its own title and words, shown to the design', async () => {
    const { inv } = await draft();
    await setPhoto(db(), inv, 0, await sharp({ create: { width: 1200, height: 1600, channels: 3, background: '#a33' } }).jpeg().toBuffer());
    await setTemplateText(db(), inv, 'photo:0:title', 'First trip');
    await setTemplateText(db(), inv, 'photo:0:caption', 'Sea, sun and us.');
    expect((await listPhotos(db(), inv.id))[0]).toMatchObject({ title: 'First trip', caption: 'Sea, sun and us.' });
    const { props } = await invitationRenderData(db(), await reload(inv.id), 'preview');
    expect(props.photos[0]).toMatchObject({ title: 'First trip', caption: 'Sea, sun and us.' });
    await expect(setTemplateText(db(), inv, 'photo:5:title', 'x')).rejects.toMatchObject({ code: 'notFound' });
  });

  it('the save route answers what the design shows and keeps the preview open; after publishing it is audited', async () => {
    const { inv } = await draft();
    const req = (body: unknown) => new Request('http://x/p/t/text', { method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
    const res = await handleTemplateTextRequest(db(), req({ key: 'field:person_1_name', value: 'Dara' }), inv, { ipHash: null, published: false });
    expect(await res.json()).toEqual({ value: 'Dara' });
    expect((await reload(inv.id)).previewExpiresAt!.getTime()).toBeGreaterThan(inv.previewExpiresAt!.getTime() - 1000);
    expect((await handleTemplateTextRequest(db(), req({ key: 'field:nope', value: 'x' }), inv, { ipHash: null, published: false })).status).toBe(400);
    expect((await handleTemplateTextRequest(db(), req({ key: 'field:person_1_name' }), inv, { ipHash: null, published: false })).status).toBe(400);
    expect((await handleTemplateTextRequest(db(), req({ key: 'field:person_1_name', value: 'x' }), null, { ipHash: null, published: false })).status).toBe(404);
    await handleTemplateTextRequest(db(), req({ key: 'field:person_2_name', value: 'Ava' }), inv, { ipHash: null, published: true });
    const [log] = await db().select().from(auditLogs).where(and(eq(auditLogs.objectId, inv.id), eq(auditLogs.action, 'invitation.text_changed')));
    // The key only: the customer's words stay out of the log.
    expect(log?.after).toEqual({ key: 'field:person_2_name' });
  });
});

describe('the couple’s video', () => {
  it('is converted to a phone-friendly MP4 of at most a minute, with a still and no metadata', async () => {
    const work = mkdtempSync(path.join(dir, 'work-'));
    const out = await processVideo(clip('long.mp4', VIDEO_MAX_SECONDS + 8), work);
    expect(out.video.mime).toBe('video/mp4');
    expect(out.video.durationSeconds).toBe(VIDEO_MAX_SECONDS);
    expect(Math.max(out.video.width, out.video.height)).toBe(1280);
    expect(out.video.data.includes(Buffer.from('+36.19'))).toBe(false);
    expect(out.poster.data.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
    rmSync(work, { recursive: true, force: true });
  }, 180_000);

  it('is stored for the invitation, replaced, and removed with its files', async () => {
    const { inv } = await draft();
    const work = mkdtempSync(path.join(dir, 'work-'));
    const first = await setVideo(db(), inv, clip('a.mp4', 2), work);
    expect(first.src).toMatch(/videos\/.+\.mp4$/);
    let row = await reload(inv.id);
    expect(await customerVideo(db(), row)).toMatchObject({ width: first.width, height: first.height });
    const firstKeys = (await db().select().from(assets).where(eq(assets.id, row.videoAssetId!))).map((a) => a.storageKey);
    await setVideo(db(), row, clip('b.mp4', 2), work);
    // The first one's files are gone.
    expect(await storage().get(firstKeys[0]!)).toBeNull();
    row = await reload(inv.id);
    const { props } = await invitationRenderData(db(), row, 'preview');
    expect(props.video?.src).toMatch(/videos\//);
    expect(await removeVideo(db(), row.id)).toBe(true);
    row = await reload(inv.id);
    expect(row.videoAssetId).toBeNull();
    expect(await customerVideo(db(), row)).toBeNull();
    rmSync(work, { recursive: true, force: true });
  }, 120_000);
});

describe('posters', () => {
  it('print the WhatsApp number spaced for reading', () => {
    expect(spacedPhone('+9647701234567')).toBe('+964 770 123 4567');
    expect(spacedPhone('+441234567890')).toBe('+441234567890');
  });
});

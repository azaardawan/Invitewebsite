import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { invitationVideos, invitations, themes } from '@/server/db/schema';
import { syncThemesFromRegistry, transitionTheme, updateThemeSettings } from '@/server/catalog/themes';
import { createPackage, updatePackage } from '@/server/catalog/packages';
import { savePalette } from '@/server/catalog/palettes';
import { paletteChoice, templateState } from '@/server/storefront/order';
import { storeImage } from '@/server/media/assets';
import { createDraft } from '@/server/orders/drafts';
import { invitationRenderData } from '@/server/invitation/load';
import { setTemplateText } from '@/server/template/text';
import { customerVideos, deleteVideosOf, removeVideo, setVideo, videoPlaces } from '@/server/video/video';
import { listPhotos, photoSpec, removePhoto, setPhoto } from '@/server/photos/photos';
import { randomToken } from '@/lib/crypto';
import type { ThemeManifest } from '@/theme-sdk/manifest';
import { activeTheme, testManifest } from '../fixtures';
import { ctx, uniqueKey } from '../helpers';

/**
 * Designs with several screens (manifest `videos`): packages sell 1…3 videos; and packages offer their own colour sets
 * (owner, 2026-11-19: the Pink Dreamhouse's Basic / VIP / VVIP).
 */
const FIELDS = ['person_1_name', 'invitation_message'] as const;
const dir = mkdtempSync(path.join(tmpdir(), 'bahja-media-test-'));
let shop: { key: string; themeId: string; two: string; all: string; actor: { adminId: string; ipHash: null }; sets: string[]; manifest: ThemeManifest };

function clip(name: string) {
  const file = path.join(dir, name);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=640x360:rate=25:duration=2', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', file]);
  return file;
}

async function draft(packageId: string) {
  const d = await createDraft(db(), { themeKey: shop.key, packageId, locale: 'en', values: {} }, { ...ctx, ipHash: randomToken(8) });
  return (await db().select().from(invitations).where(eq(invitations.id, d.invitationId)))[0]!;
}

beforeAll(async () => {
  const base = await activeTheme();
  const key = uniqueKey('screens');
  const manifest = testManifest(key, 1, {
    sections: ['birthday'],
    fields: [...FIELDS],
    features: ['photos', 'video', 'color_choice'],
    editor: 'template',
    validStates: [{ features: ['photos', 'video', 'color_choice'], fields: [...FIELDS] }],
    photos: { max: 6, attached: 2 },
    videos: { max: 3, labels: [{ ar: 'الثلاجة', en: 'Fridge' }, { ar: 'السينما', en: 'Cinema' }, { ar: 'الجناح', en: 'Suite' }] },
    colors: { slots: [{ key: 'walls', label: { ar: 'الجدران', en: 'Walls' }, default: '#f6b8cf' }] },
    print: undefined,
  }) as ThemeManifest;
  await syncThemesFromRegistry(db(), [manifest], base.actor, { complete: false });
  const [t] = await db().select().from(themes).where(eq(themes.key, key));
  const cover = await storeImage(db(), await sharp({ create: { width: 331, height: 431, channels: 3, background: '#f9c' } }).png().toBuffer(), { uploadedBy: null });
  await updateThemeSettings(db(), t!.id, { name: t!.name, sectionId: t!.sectionId, coverAssetId: cover.id, musicTrackId: null }, base.actor);
  const sets = [];
  for (const [en, walls] of [['Blush', '#f6b8cf'], ['Lavender', '#e3cdec'], ['Mint', '#c6e8da']] as const) {
    sets.push(await savePalette(db(), t!.id, { name: { ar: en, en }, colors: { walls } }, base.actor));
  }
  const features = ['photos', 'video', 'color_choice'] as const;
  const two = await createPackage(db(), t!.id, { name: { ar: 'VIP', en: 'VIP' }, priceIqd: 30000, fieldKeys: [...FIELDS], featureKeys: [...features], videoLimit: 2, paletteIds: [sets[0]!, sets[1]!] }, base.actor);
  const all = await createPackage(db(), t!.id, { name: { ar: 'VVIP', en: 'VVIP' }, priceIqd: 60000, fieldKeys: [...FIELDS], featureKeys: [...features] }, base.actor);
  await transitionTheme(db(), t!.id, 'READY_FOR_REVIEW', base.actor);
  await transitionTheme(db(), t!.id, 'ACTIVE', base.actor);
  shop = { key, themeId: t!.id, two: two.id, all: all.id, actor: base.actor as { adminId: string; ipHash: null }, sets, manifest };
}, 60_000);

describe('several videos', () => {
  it('a package sells up to the design’s screens; none more', async () => {
    const pkg = { name: { ar: 'س', en: 'X' }, priceIqd: 10000, fieldKeys: [...FIELDS], featureKeys: ['photos', 'video', 'color_choice'] as ('photos' | 'video' | 'color_choice')[] };
    await expect(updatePackage(db(), shop.two, { ...pkg, videoLimit: 4 }, shop.actor)).rejects.toThrow();
    // A design with one video holds one.
    const plain = await activeTheme();
    await expect(updatePackage(db(), plain.basic.id, { name: plain.basic.name, priceIqd: 25000, fieldKeys: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name'], featureKeys: ['music', 'print_card'], videoLimit: 2 }, plain.actor)).rejects.toThrow();
  });

  it('each place has its own video; a package with two has two places', async () => {
    const inv = await draft(shop.two);
    expect(inv.videoLimit).toBe(2);
    expect(videoPlaces(inv, shop.manifest)).toBe(2);
    expect(videoPlaces({ ...inv, videoLimit: null }, shop.manifest)).toBe(3);
    const work = mkdtempSync(path.join(dir, 'work-'));
    const second = await setVideo(db(), inv, clip('b.mp4'), work, 1);
    expect(second.src).toMatch(/videos\/.+\.mp4$/);
    // The package sells two: the third place is refused.
    await expect(setVideo(db(), inv, clip('c.mp4'), work, 2)).rejects.toMatchObject({ code: 'noSuchPlace' });
    let { props } = await invitationRenderData(db(), inv, 'preview');
    expect(props.videos).toHaveLength(2);
    expect(props.videos[0]).toBeNull();
    expect(props.videos[1]?.src).toBe(second.src);
    expect(props.video).toBeNull();
    // The editor names each screen.
    const state = await templateState(inv, shop.manifest);
    expect(state.videoLabels).toEqual(['Fridge', 'Cinema']);
    expect(state.videos.map((v) => !!v)).toEqual([false, true]);
    // Replaced, then removed with its files.
    await setVideo(db(), inv, clip('d.mp4'), work, 1);
    expect(await db().select().from(invitationVideos).where(eq(invitationVideos.invitationId, inv.id))).toHaveLength(1);
    expect(await removeVideo(db(), inv.id, 1)).toBe(true);
    ({ props } = await invitationRenderData(db(), inv, 'preview'));
    expect(props.videos).toEqual([null, null]);
    // Housekeeping deletes every place's video with the photos.
    await setVideo(db(), inv, clip('e.mp4'), work, 1);
    expect(await deleteVideosOf(db(), [inv.id])).toBe(1);
    expect(await customerVideos(db(), inv, 2)).toEqual([null, null]);
    rmSync(work, { recursive: true, force: true });
  }, 120_000);
});

describe('colour sets per package', () => {
  it('the editor offers only the package’s sets, and the server refuses the others', async () => {
    const inv = await draft(shop.two);
    expect(inv.paletteIds?.slice().sort()).toEqual([shop.sets[0]!, shop.sets[1]!].sort());
    const choice = await paletteChoice(shop.themeId, null, 'en', inv.paletteIds);
    expect(choice?.options.map((o) => o.name)).toEqual(['Blush', 'Lavender']);
    expect(await setTemplateText(db(), inv, 'palette', shop.sets[1]!)).toBe(shop.sets[1]);
    await expect(setTemplateText(db(), inv, 'palette', shop.sets[2]!)).rejects.toMatchObject({ code: 'invalidChoice' });
    // A package with none ticked offers them all.
    const all = await draft(shop.all);
    expect(all.paletteIds).toBeNull();
    expect((await paletteChoice(shop.themeId, null, 'en', all.paletteIds))?.options).toHaveLength(3);
    expect(await setTemplateText(db(), all, 'palette', shop.sets[2]!)).toBe(shop.sets[2]);
  });

  it('only the design’s own sets can be offered', async () => {
    const other = await activeTheme();
    const foreign = await savePalette(db(), other.theme.id, { name: { ar: 'غ', en: 'Other' }, colors: {} }, other.actor).catch(() => null);
    if (!foreign) return;
    await expect(
      updatePackage(db(), shop.two, { name: { ar: 'VIP', en: 'VIP' }, priceIqd: 30000, fieldKeys: [...FIELDS], featureKeys: ['photos', 'video', 'color_choice'], paletteIds: [foreign] }, shop.actor),
    ).rejects.toMatchObject({ code: 'notValidState' });
  });
});

describe('photos attached to things in a design (a drawer’s)', () => {
  const jpeg = async (color: string) => sharp({ create: { width: 900, height: 1000, channels: 3, background: color } }).jpeg().toBuffer();

  it('have their own places from 50, are optional and on their own, and are not the package’s photos', async () => {
    const inv = await draft(shop.two);
    expect((await photoSpec(db(), inv))?.attached).toBe(2);
    // A drawer's photo, with no photo on the walls: it keeps its place.
    expect((await setPhoto(db(), inv, 51, await jpeg('#c36'))).position).toBe(51);
    await expect(setPhoto(db(), inv, 52, await jpeg('#c36'))).rejects.toMatchObject({ code: 'position' });
    // Not among the design's photos (collages, prints, counts), but given to the design.
    expect(await listPhotos(db(), inv.id)).toHaveLength(0);
    expect((await listPhotos(db(), inv.id, { attached: true })).map((p) => p.position)).toEqual([51]);
    expect((await setPhoto(db(), inv, 0, await jpeg('#36c'))).position).toBe(0);
    const { props } = await invitationRenderData(db(), inv, 'preview');
    expect(props.photos.map((p) => p.index)).toEqual([0, 51]);
    // Removing it moves nothing.
    await removePhoto(db(), inv.id, 51);
    expect((await listPhotos(db(), inv.id, { attached: true })).map((p) => p.position)).toEqual([0]);
  });
});

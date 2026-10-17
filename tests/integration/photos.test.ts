import { beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { assets, auditLogs, invitationPhotos, invitations, themes } from '@/server/db/schema';
import { storage } from '@/server/storage';
import { syncThemesFromRegistry, transitionTheme, updateThemeSettings } from '@/server/catalog/themes';
import { createPackage } from '@/server/catalog/packages';
import { storeImage } from '@/server/media/assets';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { invitationRenderData } from '@/server/invitation/load';
import { buildThemeProps } from '@/server/invitation/theme-props';
import { removeInvitationPhoto } from '@/server/invitation/admin';
import { runHousekeeping } from '@/server/housekeeping';
import { deleteOrphanPhotoFiles, listPhotos, photoSpec, removePhoto, setPhoto, setPhotoFocus, swapPhotos } from '@/server/photos/photos';
import { draftForPhotos, handlePhotoRequest } from '@/server/photos/http';
import { manifestSchema } from '@/theme-sdk/manifest';
import { randomToken } from '@/lib/crypto';
import { activeTheme, BASIC_FIELDS, testManifest, weddingValues } from '../fixtures';
import { ctx, uniqueKey } from '../helpers';

const LABELS = [
  { ar: 'صورة الغلاف', en: 'Cover photo' },
  { ar: 'الخطوبة', en: 'Engagement' },
];
let shop: { themeKey: string; withPhotos: string; withoutPhotos: string; actor: { adminId: string; ipHash: null } };

/** A camera-like JPEG with GPS and camera data in its EXIF, 3000 × 2000 px. */
async function phonePhoto(color = '#a86') {
  return sharp({ create: { width: 3000, height: 2000, channels: 3, background: color } })
    .jpeg()
    .withExifMerge({ IFD0: { Make: 'PhoneMaker', Model: 'Phone 12' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '36/1 11/1 0/1' } })
    .toBuffer();
}

async function draft(packageId = shop.withPhotos) {
  const d = await createDraft(db(), { themeKey: shop.themeKey, packageId, locale: 'en', values: weddingValues() }, { ...ctx, ipHash: randomToken(8) });
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
  return { ...d, inv: inv! };
}

beforeAll(async () => {
  const base = await activeTheme();
  const key = uniqueKey('photos');
  const features = ['photos', 'print_card'] as const;
  await syncThemesFromRegistry(
    db(),
    [
      testManifest(key, 1, {
        features: [...features],
        fields: [...BASIC_FIELDS],
        validStates: [
          { features: ['print_card'], fields: [...BASIC_FIELDS] },
          { features: [...features], fields: [...BASIC_FIELDS] },
        ],
        photos: { max: 3, min: 1, aspect: 0.8, labels: LABELS },
      }),
    ],
    base.actor,
    { complete: false },
  );
  const [t] = await db().select().from(themes).where(eq(themes.key, key));
  const cover = await storeImage(db(), await sharp({ create: { width: 330, height: 430, channels: 3, background: '#9a7' } }).png().toBuffer(), { uploadedBy: null });
  await updateThemeSettings(db(), t!.id, { name: t!.name, sectionId: t!.sectionId, coverAssetId: cover.id, musicTrackId: base.song.id }, base.actor);
  const withPhotos = await createPackage(db(), t!.id, { name: { ar: 'صور', en: 'Photos' }, priceIqd: 50000, fieldKeys: [...BASIC_FIELDS], featureKeys: [...features] }, base.actor);
  const withoutPhotos = await createPackage(db(), t!.id, { name: { ar: 'عادي', en: 'Plain' }, priceIqd: 20000, fieldKeys: [...BASIC_FIELDS], featureKeys: ['print_card'] }, base.actor);
  await transitionTheme(db(), t!.id, 'READY_FOR_REVIEW', base.actor);
  await transitionTheme(db(), t!.id, 'ACTIVE', base.actor);
  shop = { themeKey: key, withPhotos: withPhotos.id, withoutPhotos: withoutPhotos.id, actor: base.actor as { adminId: string; ipHash: null } };
});

describe('customer photos (feature `photos`)', () => {
  it('a design declares how many photos it holds, and sells them with the feature', () => {
    const base = { features: ['photos' as const], fields: [...BASIC_FIELDS], validStates: [{ features: ['photos' as const], fields: [...BASIC_FIELDS] }], print: undefined };
    const issues = (o: Parameters<typeof testManifest>[2]) => {
      const r = manifestSchema.safeParse(testManifest('photo-check', 1, { ...base, ...o }));
      return r.success ? [] : r.error.issues.map((i) => i.message);
    };
    expect(issues({ photos: { max: 7 } })).toEqual([]);
    expect(issues({ photos: undefined })).toContain('photos requires photos.max (how many photos the design holds)');
    expect(issues({ photos: { max: 3, min: 4 } })).toContain('photos.min cannot be more than photos.max');
    expect(issues({ photos: { max: 21 } }).length).toBeGreaterThan(0);
    expect(issues({ photos: { max: 20 } })).toEqual([]);
  });

  it('stores each photo re-encoded in two sizes without its location data, in its place, and replaces it', async () => {
    const { inv } = await draft();
    expect(await photoSpec(db(), inv)).toMatchObject({ max: 3, min: 1, aspect: 0.8 });
    const first = await setPhoto(db(), inv, 0, await phonePhoto());
    expect(first).toMatchObject({ position: 0, width: 1280, height: 853, focus: { x: 50, y: 50, zoom: 1 } });
    const [row] = await db().select().from(invitationPhotos).where(eq(invitationPhotos.invitationId, inv.id));
    const [full] = await db().select().from(assets).where(eq(assets.id, row!.assetId));
    expect(full).toMatchObject({ mime: 'image/webp', width: 2400, height: 1600 });
    expect(full!.storageKey).toMatch(/^photos\//);
    const meta = await sharp((await storage().get(full!.storageKey))!).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.exif).toBeUndefined();

    // Replacing the photo deletes the old files.
    await setPhoto(db(), inv, 0, await phonePhoto('#68a'));
    expect(await storage().get(full!.storageKey)).toBeNull();
    expect(await db().select().from(assets).where(eq(assets.id, row!.assetId))).toEqual([]);

    // Photos fill the places in order: asking for place 2 with only place 0 taken gives place 1 (never a gap).
    expect((await setPhoto(db(), inv, 2, await phonePhoto('#6a8'))).position).toBe(1);
    await expect(setPhoto(db(), inv, 3, await phonePhoto())).rejects.toMatchObject({ code: 'position' });
    expect((await listPhotos(db(), inv.id)).map((p) => p.position)).toEqual([0, 1]);

    expect(await setPhotoFocus(db(), inv.id, 1, { x: 120, y: 30, zoom: 2 })).toEqual({ x: 100, y: 30, zoom: 2 });
    await removePhoto(db(), inv.id, 1);
    expect((await listPhotos(db(), inv.id)).map((p) => p.position)).toEqual([0]);
  });

  it('removing a photo moves the later ones up; two photos can swap places, each keeping its placement', async () => {
    const { inv } = await draft();
    for (const c of ['#a00', '#0a0', '#00a']) await setPhoto(db(), inv, 2, await phonePhoto(c));
    const before = await listPhotos(db(), inv.id);
    expect(before.map((p) => p.position)).toEqual([0, 1, 2]);
    await setPhotoFocus(db(), inv.id, 0, { x: 10, y: 10, zoom: 1.4 });
    await swapPhotos(db(), inv.id, 0, 2);
    const swapped = await listPhotos(db(), inv.id);
    expect(swapped[0]!.src).toBe(before[2]!.src);
    expect(swapped[2]).toMatchObject({ src: before[0]!.src, focus: { x: 10, y: 10, zoom: 1.4 } });
    await removePhoto(db(), inv.id, 0);
    const after = await listPhotos(db(), inv.id);
    expect(after.map((p) => [p.position, p.src])).toEqual([
      [0, swapped[1]!.src],
      [1, swapped[2]!.src],
    ]);
  });

  it('a collage gives each place its own frame', async () => {
    const r = (o: Parameters<typeof testManifest>[2]) => manifestSchema.safeParse(testManifest('frames-check', 1, { features: ['photos'], fields: [...BASIC_FIELDS], validStates: [{ features: ['photos'], fields: [...BASIC_FIELDS] }], print: undefined, ...o }));
    expect(r({ photos: { max: 3, frames: [{ aspect: 1.6 }, { aspect: 1 }] } }).success).toBe(true);
    expect(r({ photos: { max: 1, frames: [{ aspect: 1.6 }, { aspect: 1 }] } }).success).toBe(false);
    const { inv } = await draft();
    expect((await photoSpec(db(), inv))?.aspects).toEqual([0.8, 0.8, 0.8]);
  });

  it('refuses photos on a package without them, and files that are not photos', async () => {
    const plain = await draft(shop.withoutPhotos);
    await expect(setPhoto(db(), plain.inv, 0, await phonePhoto())).rejects.toMatchObject({ code: 'notIncluded' });
    const { inv } = await draft();
    await expect(setPhoto(db(), inv, 0, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).rejects.toMatchObject({ code: 'unsupportedImage' });
    await expect(setPhoto(db(), inv, 0, await sharp({ create: { width: 120, height: 120, channels: 3, background: '#000' } }).png().toBuffer())).rejects.toMatchObject({ code: 'imageTooSmall' });
    expect(await listPhotos(db(), inv.id)).toEqual([]);
  });

  it('designs get the photos in order with their names; samples show placeholders for every place', async () => {
    const { inv } = await draft();
    await setPhoto(db(), inv, 1, await phonePhoto());
    const { props } = await invitationRenderData(db(), inv, 'preview');
    expect(props.photos).toHaveLength(1);
    // Asked for place 1 on an empty invitation: it takes place 0, the cover.
    expect(props.photos[0]).toMatchObject({ index: 0, width: 1280, label: 'Cover photo' });
    const sample = buildThemeProps({ mode: 'sample', locale: 'ar', fieldKeys: [], features: ['photos'], values: {}, musicSrc: null, photoSpec: { max: 3, labels: LABELS } });
    expect(sample.photos.map((p) => p.label)).toEqual(['صورة الغلاف', 'الخطوبة', null]);
    const none = buildThemeProps({ mode: 'sample', locale: 'ar', fieldKeys: [], features: [], values: {}, musicSrc: null, photoSpec: { max: 3 } });
    expect(none.photos).toEqual([]);
  });

  it('a design that needs photos cannot be ordered without them', async () => {
    const d = await draft();
    const customer = { name: 'Sara', phone: '0770 123 4567', email: 'sara@example.com' };
    const order = () => createOrder(db(), { previewToken: d.previewToken, customer, acceptedTerms: true, idempotencyKey: randomToken(18) }, { ...ctx, ipHash: randomToken(8) });
    await expect(order()).rejects.toMatchObject({ code: 'photosMissing' });
    await setPhoto(db(), d.inv, 0, await phonePhoto());
    const o = await order();
    // After checkout the draft's photos are locked.
    expect(await draftForPhotos(db(), d.previewToken)).toBeNull();
    await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  });

  it('uploads through the preview link: a multipart POST, a PATCH to place it, a DELETE', async () => {
    const d = await draft();
    const inv = await draftForPhotos(db(), d.previewToken);
    const body = new FormData();
    body.append('file', new Blob([new Uint8Array(await phonePhoto())], { type: 'image/jpeg' }), 'p.jpg');
    const post = await handlePhotoRequest(db(), new Request('http://x/p/t/photos/1', { method: 'POST', body }), inv, '1', { ipHash: randomToken(8), published: false });
    expect(post.status).toBe(200);
    expect(((await post.json()) as { photo: { position: number } }).photo.position).toBe(0);
    const patch = await handlePhotoRequest(db(), new Request('http://x', { method: 'PATCH', body: JSON.stringify({ x: 10, y: 20, zoom: 1.2 }) }), inv, '0', { ipHash: null, published: false });
    expect(await patch.json()).toEqual({ focus: { x: 10, y: 20, zoom: 1.2 } });
    expect((await handlePhotoRequest(db(), new Request('http://x', { method: 'DELETE' }), inv, '0', { ipHash: null, published: false })).status).toBe(200);
    expect((await handlePhotoRequest(db(), new Request('http://x', { method: 'DELETE' }), inv, '0', { ipHash: null, published: false })).status).toBe(404);
    expect((await handlePhotoRequest(db(), new Request('http://x', { method: 'DELETE' }), null, '1', { ipHash: null, published: false })).status).toBe(404);
    expect((await handlePhotoRequest(db(), new Request('http://x', { method: 'DELETE' }), inv, '../1', { ipHash: null, published: false })).status).toBe(400);
  });

  it('Admin can take a photo off (audited, with a reason)', async () => {
    const { inv } = await draft();
    await setPhoto(db(), inv, 0, await phonePhoto());
    await expect(removeInvitationPhoto(db(), inv.id, { position: 0, reason: 'x' }, shop.actor)).rejects.toMatchObject({ code: 'reason' });
    await removeInvitationPhoto(db(), inv.id, { position: 0, reason: 'Unsuitable picture' }, shop.actor);
    expect(await listPhotos(db(), inv.id)).toEqual([]);
    const logs = await db().select().from(auditLogs).where(and(eq(auditLogs.objectId, inv.id), eq(auditLogs.action, 'invitation.photo_removed')));
    expect(logs).toHaveLength(1);
  });

  it('photos of orders never paid are deleted 30 days after their preview link expired, with their files', async () => {
    const { inv } = await draft();
    await setPhoto(db(), inv, 0, await phonePhoto());
    const [row] = await db().select().from(invitationPhotos).where(eq(invitationPhotos.invitationId, inv.id));
    const [file] = await db().select().from(assets).where(eq(assets.id, row!.displayAssetId));
    // Not yet: still within the 30 days.
    await runHousekeeping(db(), new Date(Date.now() + 20 * 86400_000), { prepareKeepsakes: false });
    expect(await listPhotos(db(), inv.id)).toHaveLength(1);
    const result = await runHousekeeping(db(), new Date(Date.now() + 32 * 86400_000), { prepareKeepsakes: false });
    expect(result.photosDeleted).toBeGreaterThanOrEqual(1);
    expect(await listPhotos(db(), inv.id)).toEqual([]);
    expect(await storage().get(file!.storageKey)).toBeNull();
  });

  it('files left behind by a deleted invitation are cleaned up', async () => {
    const { inv } = await draft();
    await setPhoto(db(), inv, 0, await phonePhoto());
    const [row] = await db().select().from(invitationPhotos).where(eq(invitationPhotos.invitationId, inv.id));
    await db().delete(invitationPhotos).where(eq(invitationPhotos.id, row!.id));
    // An hour's grace for uploads in progress.
    expect(await deleteOrphanPhotoFiles(db())).toBe(0);
    expect(await deleteOrphanPhotoFiles(db(), new Date(Date.now() + 2 * 3600_000))).toBeGreaterThanOrEqual(2);
    expect(await db().select().from(assets).where(eq(assets.id, row!.assetId))).toEqual([]);
  });
});

import { beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { invitations, themes } from '@/server/db/schema';
import { syncThemesFromRegistry, transitionTheme, updateThemeSettings } from '@/server/catalog/themes';
import { createPackage } from '@/server/catalog/packages';
import { storeImage } from '@/server/media/assets';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { invitationRenderData } from '@/server/invitation/load';
import { photoSpec, setPhoto } from '@/server/photos/photos';
import { productData } from '@/server/products/data';
import { ensureProductFile, includedProducts, ProductError } from '@/server/products/files';
import { collagePhotoCount, includedCollages } from '@/catalog/collages';
import { isPlatformFeature } from '@/catalog/features';
import { randomToken } from '@/lib/crypto';
import { activeTheme, BASIC_FIELDS, testManifest, weddingValues } from '../fixtures';
import { ctx, uniqueKey } from '../helpers';

let shop: { themeKey: string; poster: string; story: string; actor: { adminId: string; ipHash: null } };

const photo = (color: string) =>
  sharp({ create: { width: 1200, height: 900, channels: 3, background: color } })
    .jpeg()
    .toBuffer();
const fake = () => {
  const calls: string[] = [];
  return { calls, render: async (item: string) => (calls.push(item), Buffer.from(`fake ${item}`)) };
};

async function draft(packageId: string) {
  const d = await createDraft(db(), { themeKey: shop.themeKey, packageId, locale: 'en', values: weddingValues() }, { ...ctx, ipHash: randomToken(8) });
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
  return { ...d, inv: inv! };
}

beforeAll(async () => {
  const base = await activeTheme();
  const key = uniqueKey('collages');
  await syncThemesFromRegistry(
    db(),
    [
      testManifest(key, 1, {
        features: ['photos', 'print_card'],
        fields: [...BASIC_FIELDS],
        validStates: [{ features: ['photos', 'print_card'], fields: [...BASIC_FIELDS] }],
        photos: { max: 2, aspect: 0.75 },
      }),
    ],
    base.actor,
    { complete: false },
  );
  const [t] = await db().select().from(themes).where(eq(themes.key, key));
  const cover = await storeImage(
    db(),
    await sharp({ create: { width: 330, height: 430, channels: 3, background: '#b98' } })
      .png()
      .toBuffer(),
    { uploadedBy: null },
  );
  await updateThemeSettings(db(), t!.id, { name: t!.name, sectionId: t!.sectionId, coverAssetId: cover.id, musicTrackId: base.song.id }, base.actor);
  // The cheaper package: the poster (3 photos), without the design's photos. The dearer one: the design's photos, the story and the wall.
  const poster = await createPackage(
    db(),
    t!.id,
    { name: { ar: 'بوستر', en: 'Poster' }, priceIqd: 20000, fieldKeys: [...BASIC_FIELDS], featureKeys: ['print_card', 'collage_polaroids'] },
    base.actor,
  );
  const story = await createPackage(
    db(),
    t!.id,
    {
      name: { ar: 'ذكريات', en: 'Memories' },
      priceIqd: 50000,
      fieldKeys: [...BASIC_FIELDS],
      featureKeys: ['photos', 'print_card', 'collage_story', 'collage_wall'],
    },
    base.actor,
  );
  await transitionTheme(db(), t!.id, 'READY_FOR_REVIEW', base.actor);
  await transitionTheme(db(), t!.id, 'ACTIVE', base.actor);
  shop = { themeKey: key, poster: poster.id, story: story.id, actor: base.actor as { adminId: string; ipHash: null } };
});

describe('photo collages (features `collage_*`)', () => {
  it('are platform features, each with its number of photos; a package asks for as many as its largest collage', () => {
    for (const f of ['collage_polaroids', 'collage_story', 'collage_wall']) expect(isPlatformFeature(f)).toBe(true);
    expect(collagePhotoCount(['print_card'])).toBe(0);
    expect(collagePhotoCount(['collage_polaroids'])).toBe(3);
    expect(collagePhotoCount(['collage_story', 'collage_polaroids'])).toBe(4);
    expect(collagePhotoCount(['collage_wall', 'collage_story'])).toBe(9);
    expect(includedCollages(['collage_wall', 'collage_polaroids'])).toEqual(['polaroids', 'wall']);
  });

  it('give a package photo places even without the design’s photos; the design still shows only its own', async () => {
    const poster = await draft(shop.poster);
    expect(await photoSpec(db(), poster.inv)).toMatchObject({ max: 3, min: 0, aspects: [0.8, 0.8, 0.8] });
    const story = await draft(shop.story);
    // The design's two places keep its frame; the collages' take theirs.
    expect(await photoSpec(db(), story.inv)).toMatchObject({ max: 9, aspect: 0.75, aspects: [0.75, 0.75, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8] });
    for (const [i, color] of ['#c86', '#6a8', '#68c', '#c6a'].entries()) await setPhoto(db(), story.inv, i, await photo(color));
    const { props } = await invitationRenderData(db(), story.inv, 'live');
    expect(props.photos).toHaveLength(2);
    // Every collage takes all of them, full size, with its lines in the invitation's language.
    const data = await productData(db(), story.inv);
    expect(data.collage.photos).toHaveLength(4);
    expect(data.collage.photos[0]!.src).toMatch(/photos\//);
    expect(data.collage).toMatchObject({ name: 'علي', text: { headingTop: 'Happy', caption: 'HAPPY BIRTHDAY' } });
    expect(includedProducts(story.inv)).toEqual(['collage_story', 'collage_wall']);
  });

  it('are watermarked previews before payment and pictures to download after, only those in the package', async () => {
    const d = await draft(shop.story);
    await setPhoto(db(), d.inv, 0, await photo('#a86'));
    const r = fake();
    expect((await ensureProductFile(db(), d.invitationId, 'collage-wall.preview', r.render)).type).toBe('image/jpeg');
    await expect(ensureProductFile(db(), d.invitationId, 'collage-wall.jpg', r.render)).rejects.toMatchObject({ code: 'notPaid' });
    await expect(ensureProductFile(db(), d.invitationId, 'collage-polaroids.preview', r.render)).rejects.toBeInstanceOf(ProductError);
    // A stored picture is handed out again while nothing it shows has changed; a new photo draws it again.
    await ensureProductFile(db(), d.invitationId, 'collage-wall.preview', r.render);
    expect(r.calls).toEqual(['collage-wall.preview']);
    await setPhoto(db(), d.inv, 1, await photo('#68a'));
    await ensureProductFile(db(), d.invitationId, 'collage-wall.preview', r.render);
    expect(r.calls).toHaveLength(2);

    const o = await createOrder(
      db(),
      {
        previewToken: d.previewToken,
        customer: { name: 'Sara', phone: '07701234567', email: 'sara@bahja.test' },
        acceptedTerms: true,
        idempotencyKey: randomToken(18),
      },
      { ...ctx, ipHash: randomToken(8) },
    );
    await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
    const file = await ensureProductFile(db(), d.invitationId, 'collage-story.jpg', r.render);
    expect(file).toMatchObject({ type: 'image/jpeg' });
    expect(file.fileName).toMatch(/^collage-story-.+\.jpg$/);
  });
});

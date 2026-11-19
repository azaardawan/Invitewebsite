/**
 * E2E fixture: puts the Pink Dreamhouse on sale (allowed in development) with the owner's plan of packages: Basic (two
 * rooms, 6 photos, Rose Cream besides its own colours) and VVIP (the whole house, 24 photos, three videos, every colour
 * set, music), then creates an empty draft of the package `HOUSE_TIER` (basic | vvip). Prints { previewToken, packageId }.
 */
import { and, asc, eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { musicTracks, themePalettes, themes } from '../../src/server/db/schema';
import { createMusicTrack } from '../../src/server/catalog/music';
import { createPackage } from '../../src/server/catalog/packages';
import { packagesWithShape, transitionTheme, updateThemeSettings } from '../../src/server/catalog/themes';
import { storeAudio, storeImage } from '../../src/server/media/assets';
import { createDraft } from '../../src/server/orders/drafts';
import { randomToken } from '../../src/lib/crypto';

function mp3(seconds: number) {
  const frame = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(413)]);
  return Buffer.concat(Array.from({ length: Math.ceil((seconds * 44100) / 1152) }, () => frame));
}

const FIELDS = ['person_1_name', 'invitation_message'] as const;

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'pink-dreamhouse'));
  if (!t) throw new Error('pink-dreamhouse not registered (run db:seed)');
  const cover = await storeImage(db(), await sharp({ create: { width: 420, height: 600, channels: 3, background: '#f6b8cf' } }).png().toBuffer(), { uploadedBy: null });
  let song = t.musicTrackId;
  if (!song) {
    const audio = await storeAudio(db(), mp3(3.3), { uploadedBy: null });
    song =
      (await createMusicTrack(db(), { title: `e2e-house-${randomToken(4)}`, assetId: audio.id }, actor).catch(() => null))?.id ??
      (await db().select().from(musicTracks).where(eq(musicTracks.assetId, audio.id)))[0]!.id;
  }
  await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: song }, actor);
  const [rose] = await db().select().from(themePalettes).where(and(eq(themePalettes.themeId, t.id), eq(themePalettes.status, 'ACTIVE'))).orderBy(asc(themePalettes.sortOrder));
  const tier = process.env.HOUSE_TIER === 'basic' ? 'basic' : 'vvip';
  const want = tier === 'basic' ? { photoLimit: 6, features: ['photos', 'color_choice'] as const } : { photoLimit: null, features: ['photos', 'video', 'color_choice', 'music'] as const };
  const existing = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && p.photoLimit === want.photoLimit && p.featureKeys.length === want.features.length);
  const packageId =
    existing?.id ??
    (
      await createPackage(
        db(),
        t.id,
        {
          name: tier === 'basic' ? { ar: 'أساسية', en: 'Basic' } : { ar: 'VVIP', en: 'VVIP' },
          priceIqd: tier === 'basic' ? 25000 : 75000,
          fieldKeys: [...FIELDS],
          featureKeys: [...want.features],
          photoLimit: want.photoLimit,
          paletteIds: tier === 'basic' && rose ? [rose.id] : null,
        },
        actor,
      )
    ).id;
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);
  const d = await createDraft(db(), { themeKey: 'pink-dreamhouse', packageId, locale: 'en', values: {}, occasion: 'birthday' }, { ipHash: randomToken(8), userAgent: 'e2e' });
  console.log(JSON.stringify({ previewToken: d.previewToken, packageId }));
} finally {
  await closeDb();
}

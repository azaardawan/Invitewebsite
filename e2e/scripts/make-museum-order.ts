/**
 * E2E fixture: puts the Memory Museum couples design on sale (allowed in development) with a package of two rooms
 * (16 photos, rooms of eight) and the video, then creates an empty draft, as a customer does before filling the design
 * in place. Prints { previewToken, packageId }. With MUSEUM_COLOURS=1: the newest version (v2) on sale and a package of two
 * rooms with colour choice (the owner's wall colours) and background music.
 */
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { musicTracks, themes } from '../../src/server/db/schema';
import { createMusicTrack } from '../../src/server/catalog/music';
import { createPackage } from '../../src/server/catalog/packages';
import { packagesWithShape, setCurrentVersion, transitionTheme, updateThemeSettings } from '../../src/server/catalog/themes';
import { and } from 'drizzle-orm';
import { themeVersions } from '../../src/server/db/schema';
import { storeAudio, storeImage } from '../../src/server/media/assets';
import { createDraft } from '../../src/server/orders/drafts';
import { randomToken } from '../../src/lib/crypto';

function mp3(seconds: number) {
  const frame = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(413)]);
  return Buffer.concat(Array.from({ length: Math.ceil((seconds * 44100) / 1152) }, () => frame));
}

const FIELDS = ['person_1_name', 'person_2_name', 'invitation_message'] as const;

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'memory-museum'));
  if (!t) throw new Error('memory-museum not registered (run db:seed)');
  const cover = await storeImage(db(), await sharp({ create: { width: 420, height: 600, channels: 3, background: '#1d2a2a' } }).png().toBuffer(), { uploadedBy: null });
  await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: t.musicTrackId }, actor);
  const colours = process.env.MUSEUM_COLOURS === '1';
  if (colours && !t.musicTrackId) {
    // The colour package also has background music: the design needs a song (the same test audio may already be one).
    const audio = await storeAudio(db(), mp3(3.3), { uploadedBy: null });
    const song =
      (await createMusicTrack(db(), { title: `e2e-museum-${randomToken(4)}`, assetId: audio.id }, actor).catch(() => null)) ??
      (await db().select().from(musicTracks).where(eq(musicTracks.assetId, audio.id)))[0]!;
    await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: song.id }, actor);
  }
  if (colours) {
    const [v2] = await db().select().from(themeVersions).where(and(eq(themeVersions.themeId, t.id), eq(themeVersions.version, 2)));
    if (t.currentVersionId !== v2!.id) await setCurrentVersion(db(), t.id, v2!.id, actor);
  }
  const features = colours ? (['photos', 'video', 'color_choice', 'music'] as const) : (['photos', 'video'] as const);
  const existing = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && p.photoLimit === 16 && p.featureKeys.includes('color_choice') === colours && p.featureKeys.includes('music') === colours);
  const packageId =
    existing?.id ??
    (
      await createPackage(
        db(),
        t.id,
        { name: { ar: colours ? 'قاعتان بألوان' : 'قاعتان وفيديو', en: colours ? 'Two rooms in colour' : 'Two rooms and a video' }, priceIqd: 30000, fieldKeys: [...FIELDS], featureKeys: [...features], photoLimit: 16 },
        actor,
      )
    ).id;
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);
  // The design may also be sold in Friends (memory-museum.spec): this order is for a couple.
  const d = await createDraft(db(), { themeKey: 'memory-museum', packageId, locale: 'en', values: {}, occasion: 'couples' }, { ipHash: randomToken(8), userAgent: 'e2e' });
  console.log(JSON.stringify({ previewToken: d.previewToken, packageId }));
} finally {
  await closeDb();
}

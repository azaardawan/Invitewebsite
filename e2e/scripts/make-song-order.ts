/**
 * E2E fixture: puts the internal demo-wedding theme on sale (allowed in development) with a design song and a package
 * that has "your own song" (custom_music), then creates an unpaid draft. Prints { previewToken }.
 */
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { musicTracks, themes } from '../../src/server/db/schema';
import { createPackage } from '../../src/server/catalog/packages';
import { createMusicTrack } from '../../src/server/catalog/music';
import { packagesWithShape, transitionTheme, updateThemeSettings } from '../../src/server/catalog/themes';
import { storeAudio, storeImage } from '../../src/server/media/assets';
import { createDraft } from '../../src/server/orders/drafts';
import { randomToken } from '../../src/lib/crypto';

const FIELDS = ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name'] as const;

function mp3(seconds: number) {
  const frame = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(413)]);
  return Buffer.concat(Array.from({ length: Math.ceil((seconds * 44100) / 1152) }, () => frame));
}

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'demo-wedding'));
  if (!t) throw new Error('demo-wedding not registered (run db:seed)');
  const cover = await storeImage(db(), await sharp({ create: { width: 420, height: 600, channels: 3, background: '#e8d5c4' } }).png().toBuffer(), { uploadedBy: null });
  const audio = await storeAudio(db(), mp3(4.1), { uploadedBy: null });
  const song =
    (await createMusicTrack(db(), { title: `e2e-song-${randomToken(4)}`, assetId: audio.id }, actor).catch(() => null)) ??
    (await db().select().from(musicTracks).where(eq(musicTracks.assetId, audio.id)))[0]!;
  await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: t.musicTrackId ?? song.id }, actor);
  const existing = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && p.featureKeys.includes('custom_music'));
  const packageId =
    existing?.id ??
    (await createPackage(db(), t.id, { name: { ar: 'أغنيتي', en: 'My song' }, priceIqd: 35000, fieldKeys: [...FIELDS], featureKeys: ['music', 'custom_music', 'print_card'] }, actor)).id;
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);
  const date = new Date(Date.now() + 40 * 86400_000).toISOString().slice(0, 10);
  const values = { person_1_name: 'Dara', person_2_name: 'Ava', event_date: date, event_time: '19:30', venue_name: 'Grand Hall' };
  const d = await createDraft(db(), { themeKey: 'demo-wedding', packageId, locale: 'en', values }, { ipHash: randomToken(8), userAgent: 'e2e' });
  console.log(JSON.stringify({ previewToken: d.previewToken }));
} finally {
  await closeDb();
}

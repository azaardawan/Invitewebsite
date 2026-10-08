/**
 * E2E fixture: puts the internal demo-wedding theme on sale (allowed in development) with a package
 * that has the printable card, the customer's signature and colour choice, plus one colour set.
 * Prints { packageId, paletteId } as JSON.
 */
import { and, eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { themePalettes, themes } from '../../src/server/db/schema';
import { createPackage } from '../../src/server/catalog/packages';
import { transitionTheme, updateThemeSettings, packagesWithShape } from '../../src/server/catalog/themes';
import { savePalette } from '../../src/server/catalog/palettes';
import { storeAudio, storeImage } from '../../src/server/media/assets';
import { createMusicTrack } from '../../src/server/catalog/music';
import { musicTracks } from '../../src/server/db/schema';
import { randomToken } from '../../src/lib/crypto';

function mp3(seconds: number) {
  const frame = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(413)]);
  return Buffer.concat(Array.from({ length: Math.ceil((seconds * 44100) / 1152) }, () => frame));
}

const FEATURES = ['music', 'rsvp', 'print_card', 'signature', 'color_choice'] as const;
const FIELDS = ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name'] as const;

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'demo-wedding'));
  if (!t) throw new Error('demo-wedding not registered (run db:seed)');
  const cover = await storeImage(db(), await sharp({ create: { width: 400, height: 600, channels: 3, background: '#2c4' } }).png().toBuffer(), { uploadedBy: null });
  const audio = await storeAudio(db(), mp3(2.7), { uploadedBy: null });
  const song =
    t.musicTrackId ??
    (await createMusicTrack(db(), { title: `e2e-extras-${randomToken(4)}`, assetId: audio.id }, actor).catch(() => null))?.id ??
    (await db().select().from(musicTracks).where(eq(musicTracks.assetId, audio.id)))[0]?.id ??
    null;
  await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: song }, actor);
  const existing = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && p.name.en === 'Signature');
  const packageId = existing?.id ?? (await createPackage(db(), t.id, { name: { ar: 'باقة التوقيع', en: 'Signature' }, priceIqd: 45000, fieldKeys: [...FIELDS], featureKeys: [...FEATURES] }, actor)).id;
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);
  const [rose] = await db().select().from(themePalettes).where(and(eq(themePalettes.themeId, t.id), eq(themePalettes.status, 'ACTIVE')));
  const paletteId = rose?.id ?? (await savePalette(db(), t.id, { name: { ar: 'وردي', en: 'Rose' }, colors: { background: '#6e1f33', accent: '#f2c6d0', text: '#fff4f6' } }, actor));
  console.log(JSON.stringify({ packageId, paletteId }));
} finally {
  await closeDb();
}

/**
 * E2E fixture: puts Royal Olive Crest on sale with a package whose customers type their own seal initials (two
 * boxes). Prints { packageId }. With `shapes`: a package that also sells the leaf and the heart cards; prints its id as
 * { packageId } instead.
 */
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { themes } from '../../src/server/db/schema';
import { createPackage } from '../../src/server/catalog/packages';
import { packagesWithShape, transitionTheme, updateThemeSettings } from '../../src/server/catalog/themes';
import { storeImage } from '../../src/server/media/assets';

const FIELDS = ['person_1_name', 'person_2_name', 'seal_initials', 'event_date', 'event_time', 'venue_name', 'invitation_message'] as const;

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'royal-olive-crest'));
  if (!t) throw new Error('royal-olive-crest not registered (run db:seed)');
  if (t.status !== 'ACTIVE') {
    const cover = await storeImage(db(), await sharp({ create: { width: 420, height: 746, channels: 3, background: '#4a5228' } }).png().toBuffer(), { uploadedBy: null });
    await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: t.musicTrackId }, actor);
  }
  const existing = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && p.fieldKeys.includes('seal_initials'));
  const packageId = existing?.id ?? (await createPackage(db(), t.id, { name: { ar: 'الختم', en: 'Seal' }, priceIqd: 25000, fieldKeys: [...FIELDS], featureKeys: ['print_card'] }, actor)).id;
  if (process.argv.includes('shapes')) {
    const shaped = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && p.featureKeys.includes('card_leaf') && p.featureKeys.includes('card_heart'));
    const id = shaped?.id ?? (await createPackage(db(), t.id, { name: { ar: 'الأشكال', en: 'Shapes' }, priceIqd: 35000, fieldKeys: [...FIELDS], featureKeys: ['print_card', 'card_leaf', 'card_heart'] }, actor)).id;
    if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
    if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);
    console.log(JSON.stringify({ packageId: id }));
    process.exit(0);
  }
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);
  console.log(JSON.stringify({ packageId }));
} finally {
  await closeDb();
}

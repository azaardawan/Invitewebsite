/**
 * E2E fixture: puts Blush Floral (a birthday design with a place) on sale, its newest version current, with a package
 * that has the place and the map. Prints { packageId }.
 */
import { and, desc, eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { themeVersions, themes } from '../../src/server/db/schema';
import { createPackage } from '../../src/server/catalog/packages';
import { packagesWithShape, setCurrentVersion, transitionTheme, updateThemeSettings } from '../../src/server/catalog/themes';
import { storeImage } from '../../src/server/media/assets';

const FIELDS = ['person_1_name', 'event_date', 'event_time', 'venue_name', 'venue_map_url', 'invitation_message'] as const;

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'blush-floral'));
  if (!t) throw new Error('blush-floral not registered (run db:seed)');
  if (t.status !== 'ACTIVE') {
    const cover = await storeImage(db(), await sharp({ create: { width: 420, height: 588, channels: 3, background: '#f3d9d4' } }).png().toBuffer(), { uploadedBy: null });
    await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: t.musicTrackId }, actor);
  }
  const existing = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && p.fieldKeys.includes('venue_name'));
  const packageId = existing?.id ?? (await createPackage(db(), t.id, { name: { ar: 'الحفلة', en: 'Party' }, priceIqd: 20000, fieldKeys: [...FIELDS], featureKeys: ['countdown', 'map'] }, actor)).id;
  const [newest] = await db().select().from(themeVersions).where(and(eq(themeVersions.themeId, t.id), eq(themeVersions.inBuild, true))).orderBy(desc(themeVersions.version));
  if (newest && newest.id !== t.currentVersionId) await setCurrentVersion(db(), t.id, newest.id, actor);
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);
  console.log(JSON.stringify({ packageId }));
} finally {
  await closeDb();
}

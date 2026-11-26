/**
 * E2E fixture: puts Espresso & Ivory (a wedding and engagement design) on sale, its newest version current, with a
 * package that has the names, the date and place, and the printed card. Prints { packageId }.
 */
import { and, desc, eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { themeVersions, themes } from '../../src/server/db/schema';
import { createPackage } from '../../src/server/catalog/packages';
import { packagesWithShape, setCurrentVersion, transitionTheme, updateThemeSettings } from '../../src/server/catalog/themes';
import { storeImage } from '../../src/server/media/assets';

const FIELDS = ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'invitation_message'] as const;

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'espresso-ivory'));
  if (!t) throw new Error('espresso-ivory not registered (run db:seed)');
  if (t.status !== 'ACTIVE') {
    const cover = await storeImage(db(), await sharp({ create: { width: 420, height: 746, channels: 3, background: '#3d2a22' } }).png().toBuffer(), { uploadedBy: null });
    await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: t.musicTrackId }, actor);
  }
  const existing = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && p.featureKeys.includes('print_card') && p.fieldKeys.includes('venue_name'));
  const packageId =
    existing?.id ?? (await createPackage(db(), t.id, { name: { ar: 'الكامل', en: 'Full' }, priceIqd: 30000, fieldKeys: [...FIELDS], featureKeys: ['countdown', 'print_card'] }, actor)).id;
  const [newest] = await db().select().from(themeVersions).where(and(eq(themeVersions.themeId, t.id), eq(themeVersions.inBuild, true))).orderBy(desc(themeVersions.version));
  if (newest && newest.id !== t.currentVersionId) await setCurrentVersion(db(), t.id, newest.id, actor);
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);
  console.log(JSON.stringify({ packageId }));
} finally {
  await closeDb();
}

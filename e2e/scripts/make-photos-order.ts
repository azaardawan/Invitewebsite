/**
 * E2E fixture: puts the internal demo-photos theme on sale (allowed in development) with a package that has
 * photos (up to 7, at least 1), then creates an unpaid draft. Prints { previewToken }.
 */
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { themes } from '../../src/server/db/schema';
import { createPackage } from '../../src/server/catalog/packages';
import { packagesWithShape, transitionTheme, updateThemeSettings } from '../../src/server/catalog/themes';
import { storeImage } from '../../src/server/media/assets';
import { createDraft } from '../../src/server/orders/drafts';
import { randomToken } from '../../src/lib/crypto';

const FIELDS = ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name'] as const;

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'demo-photos'));
  if (!t) throw new Error('demo-photos not registered (run db:seed)');
  const cover = await storeImage(db(), await sharp({ create: { width: 420, height: 600, channels: 3, background: '#d8c3a5' } }).png().toBuffer(), { uploadedBy: null });
  await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: t.musicTrackId }, actor);
  const existing = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && p.featureKeys.includes('photos'));
  const packageId = existing?.id ?? (await createPackage(db(), t.id, { name: { ar: 'الصور', en: 'Photos' }, priceIqd: 45000, fieldKeys: [...FIELDS], featureKeys: ['photos', 'rsvp'] }, actor)).id;
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);
  const date = new Date(Date.now() + 40 * 86400_000).toISOString().slice(0, 10);
  const values = { person_1_name: 'Dara', person_2_name: 'Ava', event_date: date, event_time: '19:30', venue_name: 'Grand Hall' };
  const d = await createDraft(db(), { themeKey: 'demo-photos', packageId, locale: 'en', values }, { ipHash: randomToken(8), userAgent: 'e2e' });
  console.log(JSON.stringify({ previewToken: d.previewToken, packageId }));
} finally {
  await closeDb();
}

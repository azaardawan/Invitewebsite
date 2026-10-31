/**
 * E2E fixture: puts the BAHJAFLIX couples design on sale (allowed in development) with a package of photos (up to 9)
 * and the video, then creates an empty draft, as a customer does before filling the design in place. Prints
 * { previewToken, packageId }.
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

const FIELDS = ['person_1_name', 'person_2_name', 'invitation_message'] as const;

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'bahjaflix'));
  if (!t) throw new Error('bahjaflix not registered (run db:seed)');
  const cover = await storeImage(db(), await sharp({ create: { width: 420, height: 600, channels: 3, background: '#200306' } }).png().toBuffer(), { uploadedBy: null });
  await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: t.musicTrackId }, actor);
  const existing = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && p.photoLimit === 9);
  const packageId =
    existing?.id ??
    (await createPackage(db(), t.id, { name: { ar: 'تسع صور وفيديو', en: 'Nine photos and a video' }, priceIqd: 35000, fieldKeys: [...FIELDS], featureKeys: ['photos', 'video'], photoLimit: 9 }, actor)).id;
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);
  const d = await createDraft(db(), { themeKey: 'bahjaflix', packageId, locale: 'en', values: {} }, { ipHash: randomToken(8), userAgent: 'e2e' });
  console.log(JSON.stringify({ previewToken: d.previewToken, packageId }));
} finally {
  await closeDb();
}

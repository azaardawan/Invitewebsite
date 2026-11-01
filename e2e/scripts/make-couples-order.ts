/**
 * E2E fixture: puts the BAHJAFLIX couples design on sale (allowed in development) with a package of two photo sets (12 photos, v2's rows of six),
 * the video and the posters, then creates an empty draft, as a customer does before filling the design in place. Prints
 * { previewToken, packageId }.
 */
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { packages, themes } from '../../src/server/db/schema';
import { createPackage } from '../../src/server/catalog/packages';
import { packagesWithShape, setCurrentVersion, transitionTheme, updateThemeSettings } from '../../src/server/catalog/themes';
import { themeVersions } from '../../src/server/db/schema';
import { and } from 'drizzle-orm';
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
  // The newest version (rows of six, the posters sold separately): new customers get it.
  const [v2] = await db().select().from(themeVersions).where(and(eq(themeVersions.themeId, t.id), eq(themeVersions.version, 3)));
  // Older test packages that don't fit it (not whole sets) are retired first.
  for (const p of await packagesWithShape(db(), t.id)) {
    if (p.status === 'ACTIVE' && p.photoLimit != null && p.photoLimit % 6 !== 0) await db().update(packages).set({ status: 'ARCHIVED' }).where(eq(packages.id, p.id));
  }
  // Older test packages that the newest version doesn't sell (the posters as one) are retired too.
  for (const p of await packagesWithShape(db(), t.id)) {
    if (p.status === 'ACTIVE' && p.featureKeys.includes('couple_poster')) await db().update(packages).set({ status: 'ARCHIVED' }).where(eq(packages.id, p.id));
  }
  if (t.currentVersionId !== v2!.id) await setCurrentVersion(db(), t.id, v2!.id, actor);
  const existing = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && p.photoLimit === 12);
  const packageId =
    existing?.id ??
    (await createPackage(db(), t.id, { name: { ar: 'مجموعتان وفيديو وملصقان', en: 'Two sets, a video and posters' }, priceIqd: 35000, fieldKeys: [...FIELDS], featureKeys: ['photos', 'video', 'couple_poster_landscape', 'couple_poster_portrait'], photoLimit: 12 }, actor)).id;
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);
  const d = await createDraft(db(), { themeKey: 'bahjaflix', packageId, locale: 'en', values: {} }, { ipHash: randomToken(8), userAgent: 'e2e' });
  console.log(JSON.stringify({ previewToken: d.previewToken, packageId }));
} finally {
  await closeDb();
}

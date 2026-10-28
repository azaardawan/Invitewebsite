/**
 * E2E/dev fixture: puts a birthday design (THEME, default Cherry Confetti Party) on sale with a package of all three
 * photo collages (plus the design's photos), creates a draft and gives it PHOTOS sample photos (default 5). Env:
 * INV_LANG, NAME, PHOTOS; PAID=1 pays it. Prints { previewToken, receiptToken, invitationId, path }.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { invitations, themes } from '../../src/server/db/schema';
import { invitationPath } from '../../src/lib/ids';
import { createPackage } from '../../src/server/catalog/packages';
import { transitionTheme, updateThemeSettings, packagesWithShape } from '../../src/server/catalog/themes';
import { storeImage } from '../../src/server/media/assets';
import { createDraft } from '../../src/server/orders/drafts';
import { createOrder } from '../../src/server/orders/checkout';
import { markOrderPaid } from '../../src/server/orders/payment';
import { setPhoto } from '../../src/server/photos/photos';
import { randomToken } from '../../src/lib/crypto';

const FIELDS = ['person_1_name', 'event_date', 'event_time', 'venue_name', 'invitation_message'] as const;
const FEATURES = ['photos', 'collage_polaroids', 'collage_story', 'collage_wall'] as const;

try {
  const actor = { adminId: null, ipHash: null };
  const themeKey = process.env.THEME ?? 'cherry-confetti-party';
  const [t] = await db().select().from(themes).where(eq(themes.key, themeKey));
  if (!t) throw new Error(`${themeKey} not registered (run db:seed)`);
  if (t.status !== 'ACTIVE') {
    const cover = await storeImage(
      db(),
      await sharp({ create: { width: 420, height: 746, channels: 3, background: '#e4e0d4' } })
        .png()
        .toBuffer(),
      { uploadedBy: null },
    );
    await updateThemeSettings(
      db(),
      t.id,
      { name: t.name, sectionId: t.sectionId, subsectionId: t.subsectionId, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: t.musicTrackId },
      actor,
    );
  }
  const existing = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && FEATURES.every((f) => p.featureKeys.includes(f)));
  const packageId =
    existing?.id ??
    (await createPackage(db(), t.id, { name: { ar: 'الذكريات', en: 'Memories' }, priceIqd: 30000, fieldKeys: [...FIELDS], featureKeys: [...FEATURES] }, actor))
      .id;
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);

  const e = process.env;
  const day = new Date(Date.now() + 20 * 86400_000).toISOString().slice(0, 10);
  const values = {
    person_1_name: e.NAME ?? 'مصطفى',
    event_date: day,
    event_time: '19:30',
    venue_name: 'قاعة الياسمين',
    invitation_message: e.MESSAGE ?? 'كل عام وأنت بخير، وعقبال المية سنة.',
  };
  const ctx = { ipHash: randomToken(8), userAgent: 'e2e' };
  const d = await createDraft(
    db(),
    { themeKey, packageId, locale: (['en', 'ckb', 'bdn'] as const).find((l) => l === e.INV_LANG) ?? 'ar', values, extras: {} },
    ctx,
  );
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
  // The sample pictures (no real people), in turn.
  const count = Number(e.PHOTOS ?? 5);
  for (let i = 0; i < count; i++) await setPhoto(db(), inv!, i, readFileSync(path.join('public/samples/photos', `photo-${(i % 6) + 1}.webp`)));
  let receiptToken: string | null = null;
  if (e.PAID === '1') {
    const o = await createOrder(
      db(),
      {
        previewToken: d.previewToken,
        customer: { name: 'زبون', phone: '07701234567', email: 'e2e@bahja.test' },
        acceptedTerms: true,
        idempotencyKey: randomToken(18),
      },
      ctx,
    );
    await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
    receiptToken = o.receiptToken;
  }
  console.log(JSON.stringify({ previewToken: d.previewToken, receiptToken, invitationId: d.invitationId, path: invitationPath(inv!.slug, inv!.publicId) }));
} finally {
  await closeDb();
}

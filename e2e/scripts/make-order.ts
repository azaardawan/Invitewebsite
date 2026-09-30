/**
 * E2E fixture: makes sure the internal demo-minimal theme is on sale (allowed in
 * development), then creates a draft + order, and a second order that is paid.
 * Prints tokens as JSON. Runs with the same env as the server (TOKEN_SECRET).
 */
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { themes } from '../../src/server/db/schema';
import { createPackage } from '../../src/server/catalog/packages';
import { createMusicTrack } from '../../src/server/catalog/music';
import { transitionTheme, updateThemeSettings, packagesWithShape } from '../../src/server/catalog/themes';
import { storeAudio, storeImage } from '../../src/server/media/assets';
import { createDraft } from '../../src/server/orders/drafts';
import { createOrder } from '../../src/server/orders/checkout';
import { markOrderPaid } from '../../src/server/orders/payment';
import { getReceipt } from '../../src/server/orders/receipt';
import { randomToken } from '../../src/lib/crypto';

function mp3(seconds: number) {
  const frame = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(413)]);
  return Buffer.concat(Array.from({ length: Math.ceil((seconds * 44100) / 1152) }, () => frame));
}

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'demo-minimal'));
  if (!t) throw new Error('demo-minimal not registered (run db:seed)');
  let pkg = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE');
  if (t.status !== 'ACTIVE') {
    const cover = await storeImage(db(), await sharp({ create: { width: 400, height: 600, channels: 3, background: '#fbe' } }).png().toBuffer(), { uploadedBy: null });
    const audio = await storeAudio(db(), mp3(2.2), { uploadedBy: null });
    const song = await createMusicTrack(db(), { title: `e2e-${randomToken(4)}`, assetId: audio.id }, actor).catch(async () => null);
    await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: cover.id, musicTrackId: song?.id ?? t.musicTrackId }, actor);
    pkg ??= await createPackage(
      db(),
      t.id,
      { name: { ar: 'باقة الاحتفال', en: 'Celebration' }, priceIqd: 35000, fieldKeys: ['person_1_name', 'event_date', 'event_time', 'venue_name'], featureKeys: ['music', 'rsvp'] },
      actor,
    ).then((p) => ({ ...p, fieldKeys: [], featureKeys: [] }));
    if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
    await transitionTheme(db(), t.id, 'ACTIVE', actor);
  }
  const packageId = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE')!.id;
  const date = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  const values = { person_1_name: 'ليان', event_date: date, event_time: '18:00', venue_name: 'حديقة الزوراء' };
  const ctx = { ipHash: randomToken(8), userAgent: 'e2e' };
  const customer = { name: 'زبون تجريبي', phone: '07701234567', email: 'e2e@bahja.test' };

  const d1 = await createDraft(db(), { themeKey: 'demo-minimal', packageId, locale: 'ar', values }, ctx);
  const d2 = await createDraft(db(), { themeKey: 'demo-minimal', packageId, locale: 'en', values: { ...values, person_1_name: 'Layan' } }, ctx);
  const o2 = await createOrder(db(), { previewToken: d2.previewToken, customer, acceptedTerms: true, idempotencyKey: randomToken(18) }, ctx);
  await markOrderPaid(db(), o2.orderId, { kind: 'WAYL' });
  const paid = await getReceipt(db(), o2.receiptToken);
  console.log(JSON.stringify({ previewToken: d1.previewToken, paidReceiptToken: o2.receiptToken, orderNumber: o2.orderNumber, invoiceNumber: paid?.invoiceNumber, path: paid?.invitation.path }));
} finally {
  await closeDb();
}

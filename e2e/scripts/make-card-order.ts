/**
 * E2E fixture: puts the Olive Ring Box theme on sale with a package
 * that includes the printable card, then creates a paid order. Prints the
 * receipt token as JSON. Runs with the same env as the server (TOKEN_SECRET).
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
import { randomToken } from '../../src/lib/crypto';

function mp3(seconds: number) {
  const frame = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(413)]);
  return Buffer.concat(Array.from({ length: Math.ceil((seconds * 44100) / 1152) }, () => frame));
}

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'olive-ring-box'));
  if (!t) throw new Error('olive-ring-box not registered (run db:seed)');
  if (t.status !== 'ACTIVE') {
    const cover = await storeImage(db(), await sharp({ create: { width: 420, height: 600, channels: 3, background: '#f6e3d8' } }).png().toBuffer(), { uploadedBy: null });
    const audio = await storeAudio(db(), mp3(3.3), { uploadedBy: null });
    const song = await createMusicTrack(db(), { title: `e2e-card-${randomToken(4)}`, assetId: audio.id }, actor).catch(() => null);
    await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: cover.id, musicTrackId: song?.id ?? t.musicTrackId }, actor);
    if (!(await packagesWithShape(db(), t.id)).some((p) => p.status === 'ACTIVE')) {
      await createPackage(
        db(),
        t.id,
        {
          name: { ar: 'عادي', en: 'Normal' },
          priceIqd: 25000,
          fieldKeys: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'invitation_message'],
          featureKeys: ['music', 'print_card'],
        },
        actor,
      );
    }
    if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
    await transitionTheme(db(), t.id, 'ACTIVE', actor);
  }
  const packageId = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE')!.id;
  const date = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  const values = { invitation_message: 'بكل الحب ندعوكم لمشاركتنا فرحتنا', person_1_name: 'علي', person_2_name: 'نور', event_date: date, event_time: '19:30', venue_name: 'قاعة الياسمين' };
  const ctx = { ipHash: randomToken(8), userAgent: 'e2e' };
  const d = await createDraft(db(), { themeKey: 'olive-ring-box', packageId, locale: 'ar', values }, ctx);
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'e2e@bahja.test' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, ctx);
  await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  console.log(JSON.stringify({ receiptToken: o.receiptToken }));
} finally {
  await closeDb();
}

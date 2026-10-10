/**
 * E2E fixture: puts the internal demo-newborn theme on sale (allowed in development) with a package that has
 * every newborn extra (card, story, sticker, bottle label), in the Girl group, then creates an order for a baby girl with square
 * stickers: left unpaid (review page, watermarked previews). Prints { previewToken, receiptToken, invitationId }.
 * PAID=1 pays it (receipt with clean files).
 */
import { and, eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { subsections, themes } from '../../src/server/db/schema';
import { createPackage } from '../../src/server/catalog/packages';
import { transitionTheme, updateThemeSettings, packagesWithShape } from '../../src/server/catalog/themes';
import { storeImage } from '../../src/server/media/assets';
import { createDraft } from '../../src/server/orders/drafts';
import { createOrder } from '../../src/server/orders/checkout';
import { markOrderPaid } from '../../src/server/orders/payment';
import { randomToken } from '../../src/lib/crypto';

const FIELDS = ['baby_name', 'baby_gender', 'mother_name', 'father_name', 'birth_date', 'baby_quote'] as const;
const FEATURES = ['print_card', 'story', 'sticker', 'bottle_label'] as const;

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'demo-newborn'));
  if (!t) throw new Error('demo-newborn not registered (run db:seed)');
  const cover = await storeImage(db(), await sharp({ create: { width: 420, height: 600, channels: 3, background: '#eaf2fb' } }).png().toBuffer(), { uploadedBy: null });
  const [girl] = await db().select({ id: subsections.id }).from(subsections).where(and(eq(subsections.sectionId, t.sectionId ?? ''), eq(subsections.key, 'girl')));
  await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, subsectionId: girl?.id ?? null, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: t.musicTrackId }, actor);
  const existing = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE' && p.featureKeys.includes('bottle_label'));
  const packageId = existing?.id ?? (await createPackage(db(), t.id, { name: { ar: 'باقة المولود', en: 'Newborn' }, priceIqd: 30000, fieldKeys: [...FIELDS], featureKeys: [...FEATURES] }, actor)).id;
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);

  const born = new Date(Date.now() - 3 * 86400_000).toISOString().slice(0, 10);
  const values = { baby_name: 'ليان', baby_gender: 'girl', mother_name: 'نور', father_name: 'علي', birth_date: born, baby_quote: 'وصلت نجمتنا الصغيرة' };
  const ctx = { ipHash: randomToken(8), userAgent: 'e2e' };
  const d = await createDraft(db(), { themeKey: 'demo-newborn', packageId, locale: 'ar', values, extras: { stickerShape: 'square' } }, ctx);
  let receiptToken: string | null = null;
  if (process.env.PAID === '1') {
    const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'e2e@bahja.test' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, ctx);
    await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
    receiptToken = o.receiptToken;
  }
  console.log(JSON.stringify({ previewToken: d.previewToken, receiptToken, invitationId: d.invitationId }));
} finally {
  await closeDb();
}

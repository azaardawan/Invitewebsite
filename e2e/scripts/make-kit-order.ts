/**
 * E2E fixture: puts the Embroidered Garden design kit on sale (cover + one
 * complete package), then creates a draft, an unpaid order and a paid order.
 * Prints tokens as JSON. Runs with the same env as the server (TOKEN_SECRET).
 */
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { themes } from '../../src/server/db/schema';
import { createPackage } from '../../src/server/catalog/packages';
import { transitionTheme, updateThemeSettings, packagesWithShape } from '../../src/server/catalog/themes';
import { storeImage } from '../../src/server/media/assets';
import { createDraft } from '../../src/server/orders/drafts';
import { createOrder } from '../../src/server/orders/checkout';
import { markOrderPaid } from '../../src/server/orders/payment';
import { getReceipt } from '../../src/server/orders/receipt';
import { randomToken } from '../../src/lib/crypto';

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'embroidered-garden'));
  if (!t) throw new Error('embroidered-garden not registered (run db:seed)');
  if (t.status !== 'ACTIVE') {
    const cover = await storeImage(db(), await sharp({ create: { width: 400, height: 700, channels: 3, background: '#e4e0d4' } }).png().toBuffer(), { uploadedBy: null });
    await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: cover.id }, actor);
    if (!(await packagesWithShape(db(), t.id)).some((p) => p.status === 'ACTIVE')) {
      await createPackage(
        db(),
        t.id,
        {
          name: { ar: 'الكاملة', en: 'Complete' },
          priceIqd: 25000,
          fieldKeys: ['baby_name', 'father_name', 'birth_date'],
          featureKeys: ['kit_story', 'kit_card', 'kit_sticker', 'kit_bottle'],
        },
        actor,
      );
    }
    if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
    await transitionTheme(db(), t.id, 'ACTIVE', actor);
  }
  const packageId = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE')!.id;
  const birth = new Date(Date.now() - 5 * 86400_000).toISOString().slice(0, 10);
  const values = { baby_name: 'عمر', father_name: 'عبدالعزيز', birth_date: birth };
  const ctx = { ipHash: randomToken(8), userAgent: 'e2e' };
  const customer = { name: 'زبون تجريبي', phone: '07701234567', email: 'e2e@bahja.test' };
  const order = async () => {
    const d = await createDraft(db(), { themeKey: 'embroidered-garden', packageId, locale: 'ar', values }, ctx);
    return createOrder(db(), { previewToken: d.previewToken, customer, acceptedTerms: true, idempotencyKey: randomToken(18) }, ctx);
  };
  const draft = await createDraft(db(), { themeKey: 'embroidered-garden', packageId, locale: 'ar', values }, ctx);
  const unpaid = await order();
  const paid = await order();
  await markOrderPaid(db(), paid.orderId, { kind: 'WAYL' });
  const receipt = await getReceipt(db(), paid.receiptToken);
  console.log(JSON.stringify({ previewToken: draft.previewToken, unpaidReceiptToken: unpaid.receiptToken, paidReceiptToken: paid.receiptToken, path: receipt?.invitation.path }));
} finally {
  await closeDb();
}

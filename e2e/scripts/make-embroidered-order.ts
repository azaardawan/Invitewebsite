/**
 * E2E/dev fixture: puts the Embroidered Garden design (files only) on sale in the newborn Boy group with a
 * package of every file (card, story, sticker, bottle label), then creates an order. Env: NAME, FATHER, INV_LANG,
 * DATE_STYLE, DIGITS, SHAPE, BOTTLE, W_BLESSED, W_SONOF; PAID=1 pays it. Prints { previewToken, receiptToken, invitationId, path }.
 */
import { and, eq } from 'drizzle-orm';
import sharp from 'sharp';
import { closeDb, db } from '../../src/server/db/client';
import { invitations, subsections, themes } from '../../src/server/db/schema';
import { invitationPath } from '../../src/lib/ids';
import { createPackage } from '../../src/server/catalog/packages';
import { transitionTheme, updateThemeSettings, packagesWithShape } from '../../src/server/catalog/themes';
import { storeImage } from '../../src/server/media/assets';
import { createDraft } from '../../src/server/orders/drafts';
import { createOrder } from '../../src/server/orders/checkout';
import { markOrderPaid } from '../../src/server/orders/payment';
import { randomToken } from '../../src/lib/crypto';

const FIELDS = ['baby_name', 'father_name', 'birth_date'] as const;
const FEATURES = ['print_card', 'story', 'sticker', 'bottle_label'] as const;

try {
  const actor = { adminId: null, ipHash: null };
  const [t] = await db().select().from(themes).where(eq(themes.key, 'embroidered-garden'));
  if (!t) throw new Error('embroidered-garden not registered (run db:seed)');
  const [boy] = await db().select({ id: subsections.id }).from(subsections).where(and(eq(subsections.sectionId, t.sectionId ?? ''), eq(subsections.key, 'boy')));
  if (t.status !== 'ACTIVE') {
    const cover = await storeImage(db(), await sharp({ create: { width: 420, height: 746, channels: 3, background: '#e4e0d4' } }).png().toBuffer(), { uploadedBy: null });
    await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, subsectionId: boy?.id ?? null, coverAssetId: t.coverAssetId ?? cover.id, musicTrackId: t.musicTrackId }, actor);
  }
  const existing = (await packagesWithShape(db(), t.id)).find((p) => p.status === 'ACTIVE');
  const packageId = existing?.id ?? (await createPackage(db(), t.id, { name: { ar: 'الكاملة', en: 'Complete' }, priceIqd: 25000, fieldKeys: [...FIELDS], featureKeys: [...FEATURES] }, actor)).id;
  if (t.status === 'DEVELOPMENT') await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
  if (t.status !== 'ACTIVE') await transitionTheme(db(), t.id, 'ACTIVE', actor);

  const e = process.env;
  const born = new Date(Date.now() - 6 * 86400_000).toISOString().slice(0, 10);
  const values = { baby_name: e.NAME ?? 'عمر', father_name: e.FATHER ?? 'عبدالعزيز', birth_date: e.BORN ?? born };
  const ctx = { ipHash: randomToken(8), userAgent: 'e2e' };
  // W_BLESSED / W_SONOF: `ar` (default), `lang`, or `custom:<text>`.
  const pick = (v?: string) => (v ? { choice: v.split(':')[0]!, text: v.split(':').slice(1).join(':') } : undefined);
  const wording = Object.fromEntries(
    Object.entries({ blessed: pick(e.W_BLESSED), sonOf: pick(e.W_SONOF) }).filter((x): x is [string, { choice: string; text: string }] => !!x[1]),
  );
  const extras = { stickerShape: e.SHAPE ?? 'round', bottleSize: e.BOTTLE ?? '330', birthDateStyle: e.DATE_STYLE ?? 'long', birthDateDigits: e.DIGITS ?? 'arab', wording };
  const d = await createDraft(db(), { themeKey: 'embroidered-garden', packageId, locale: (['en', 'ckb', 'bdn'] as const).find((l) => l === e.INV_LANG) ?? 'ar', values, extras }, ctx);
  let receiptToken: string | null = null;
  if (e.PAID === '1') {
    const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'e2e@bahja.test' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, ctx);
    await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
    receiptToken = o.receiptToken;
  }
  const [inv] = await db().select({ slug: invitations.slug, publicId: invitations.publicId }).from(invitations).where(eq(invitations.id, d.invitationId));
  console.log(JSON.stringify({ previewToken: d.previewToken, receiptToken, invitationId: d.invitationId, path: invitationPath(inv!.slug, inv!.publicId) }));
} finally {
  await closeDb();
}

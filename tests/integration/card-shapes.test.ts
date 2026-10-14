import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { generatedDocuments, invitations, themes } from '@/server/db/schema';
import { seedCatalog } from '@/server/catalog/seed';
import { syncThemesFromRegistry, transitionTheme, updateThemeSettings } from '@/server/catalog/themes';
import { storeImage } from '@/server/media/assets';
import sharp from 'sharp';
import { createPackage, updatePackage } from '@/server/catalog/packages';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { printData } from '@/server/documents/data';
import { ensureDocument, ensurePreview, printShopCard } from '@/server/documents/documents';
import { CARD_SHAPES, CARD_SHAPE_KEYS, outlinePath } from '@/catalog/card-shapes';
import { designCardShapes, manifestSchema } from '@/theme-sdk/manifest';
import { randomToken } from '@/lib/crypto';
import { BASIC_FIELDS, testManifest, weddingValues } from '../fixtures';
import { ctx, ensureSeeded, makeAdmin, uniqueKey } from '../helpers';

let actor: { adminId: string; ipHash: null };
let themeKey: string;
let themeId: string;

beforeAll(async () => {
  await ensureSeeded();
  await seedCatalog(db());
  actor = { adminId: (await makeAdmin()).id, ipHash: null };
  themeKey = uniqueKey('shapes');
  const manifest = testManifest(themeKey, 1, { features: ['print_card'], validStates: [{ features: ['print_card'], fields: [...BASIC_FIELDS] }], fields: [...BASIC_FIELDS] });
  manifest.print = { card: { size: 'A5', shapes: ['A5', 'leaf'], bleedMm: 3, qr: true } };
  await syncThemesFromRegistry(db(), [manifest], actor, { complete: false });
  const [t] = await db().select().from(themes).where(eq(themes.key, themeKey));
  themeId = t!.id;
  const cover = await storeImage(db(), await sharp({ create: { width: 333, height: 444, channels: 3, background: '#9a7' } }).png().toBuffer(), { uploadedBy: null });
  await updateThemeSettings(db(), themeId, { name: t!.name, sectionId: t!.sectionId, coverAssetId: cover.id }, actor);
});

const fake = () => {
  const calls: string[] = [];
  return { calls, render: async (kind: string, _id: string, opts: { shape?: string } = {}) => (calls.push(`${kind}:${opts.shape ?? '-'}`), Buffer.from(`%PDF-1.7 ${kind} ${opts.shape}`)) };
};

describe('card shapes catalogue', () => {
  it('scales an outline to a box, mirrored for the back, and every shape has a closed outline or none', () => {
    for (const k of CARD_SHAPE_KEYS) {
      const o = CARD_SHAPES[k].outline as string | null;
      if (o) expect(o).toMatch(/^M[-\d. ]+( C[-\d. ]+)+Z$/);
    }
    expect(outlinePath('A5', { width: 148, height: 210 })).toBeNull();
    const leaf = outlinePath('leaf', { width: 126, height: 200, offsetX: 3, offsetY: 3 })!;
    const nums = leaf.match(/-?\d*\.?\d+/g)!.map(Number);
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    // Within the card's box on the page (control points may stray a little outside the curve).
    expect(Math.min(...xs)).toBeGreaterThan(0);
    expect(Math.max(...xs)).toBeLessThan(132);
    expect(Math.max(...ys)).toBeLessThan(206);
    // The back is the front's mirror image: the top tip moves to the other side.
    const tipFront = Number(leaf.slice(1).split(' ')[0]);
    const tipBack = Number(outlinePath('leaf', { width: 126, height: 200, offsetX: 3, offsetY: 3, mirror: true })!.slice(1).split(' ')[0]);
    expect(tipFront + tipBack).toBeCloseTo(132, 1);
  });

  it('a design lists its shapes, its main one first; unknown shapes are refused', () => {
    const base = testManifest('shapes-check');
    expect(designCardShapes(base)).toEqual(['A5']);
    expect(designCardShapes({ print: { card: { size: 'leaf', shapes: ['A5', 'leaf'], bleedMm: 3, qr: false } } })).toEqual(['leaf', 'A5']);
    expect(manifestSchema.safeParse({ ...base, print: { card: { size: 'A5', shapes: ['A5', 'leaf'], bleedMm: 3, qr: true } } }).success).toBe(true);
    expect(manifestSchema.safeParse({ ...base, print: { card: { size: 'A5', shapes: ['A5', 'star'], bleedMm: 3, qr: true } } }).success).toBe(false);
    expect(manifestSchema.safeParse({ ...base, print: { card: { size: 'A5', shapes: ['leaf'], bleedMm: 3, qr: true } } }).success).toBe(false);
  });
});

describe('card shapes per package', () => {
  it('a package includes the shapes the owner ticks (only those the design offers); its orders get them', async () => {
    const pkg = await createPackage(db(), themeId, { name: { ar: 'ورقة', en: 'Leaf' }, priceIqd: 30000, fieldKeys: [...BASIC_FIELDS], featureKeys: ['print_card'], cardShapes: ['A5', 'leaf'] }, actor);
    expect(pkg.cardShapes).toEqual(['A5', 'leaf']);
    await expect(updatePackage(db(), pkg.id, { name: pkg.name, priceIqd: 30000, fieldKeys: [...BASIC_FIELDS], featureKeys: ['print_card'], cardShapes: ['heart'] }, actor)).rejects.toMatchObject({ code: 'invalid' });
    // Saving without the shapes keeps them; just the main shape is stored as "default".
    await updatePackage(db(), pkg.id, { name: pkg.name, priceIqd: 32000, fieldKeys: [...BASIC_FIELDS], featureKeys: ['print_card'] }, actor);
    const plain = await createPackage(db(), themeId, { name: { ar: 'عادي', en: 'Plain' }, priceIqd: 20000, fieldKeys: [...BASIC_FIELDS], featureKeys: ['print_card'], cardShapes: ['A5'] }, actor);
    expect(plain.cardShapes).toBeNull();

    await transitionTheme(db(), themeId, 'READY_FOR_REVIEW', actor);
    await transitionTheme(db(), themeId, 'ACTIVE', actor);
    const visitor = { ...ctx, ipHash: randomToken(8) };
    const d = await createDraft(db(), { themeKey, packageId: pkg.id, locale: 'ar', values: weddingValues() }, visitor);
    const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
    await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
    const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
    expect(inv!.cardShapes).toEqual(['A5', 'leaf']);

    // Each shape prints at its own size; the leaf's back is the same size (not landscape), mirrored.
    const a5 = await printData(db(), inv!, 'card');
    const leaf = await printData(db(), inv!, 'card', { shape: 'leaf' });
    if (a5.kind !== 'card' || leaf.kind !== 'card') throw new Error('card expected');
    expect(a5.page).toMatchObject({ width: '148mm', height: '210mm' });
    expect(a5.backPage).toMatchObject({ width: '210mm', height: '148mm' });
    expect(a5.cut).toBeNull();
    expect(leaf.page).toMatchObject({ width: '126mm', height: '200mm' });
    expect(leaf.backPage).toMatchObject({ width: '126mm', height: '200mm' });
    expect(leaf.props.card).toMatchObject({ shape: 'leaf', widthMm: 126, heightMm: 200, bleedMm: 3 });
    expect(leaf.props.card.outline).not.toEqual(leaf.back.card.outline);
    expect((await printData(db(), inv!, 'cardBleed', { shape: 'leaf' })).page).toMatchObject({ width: '132mm', height: '206mm' });
    // A shape the package doesn't include falls back to the first.
    expect((await printData(db(), inv!, 'card', { shape: 'heart' })).kind === 'card' && (await printData(db(), inv!, 'card', { shape: 'heart' }))).toMatchObject({ shape: 'A5' });

    // One stored file per shape, each named for it.
    const r = fake();
    const first = await ensureDocument(db(), inv!.id, 'card', { render: r.render as never });
    const second = await ensureDocument(db(), inv!.id, 'card', { render: r.render as never, shape: 'leaf' });
    expect(first.fileName).toBe(`invitation-card-${inv!.publicId}.pdf`);
    expect(second.fileName).toBe(`invitation-card-leaf-${inv!.publicId}.pdf`);
    await ensureDocument(db(), inv!.id, 'card', { render: r.render as never, shape: 'leaf' });
    expect(r.calls).toEqual(['card:A5', 'card:leaf']);
    const rows = await db().select().from(generatedDocuments).where(eq(generatedDocuments.invitationId, inv!.id));
    expect(rows.filter((x) => x.kind === 'PRINT_CARD').map((x) => x.variant).sort()).toEqual(['', 'leaf']);
    const p = fake();
    await ensurePreview(db(), inv!.id, 'cardBack', p.render as never, { shape: 'leaf' });
    expect(p.calls).toEqual(['cardBack:leaf']);
    const shop = await printShopCard(db(), inv!.id, r.render as never, { shape: 'leaf' });
    expect(shop.fileName).toBe(`invitation-card-leaf-${inv!.publicId}-print-shop.pdf`);
  });
});

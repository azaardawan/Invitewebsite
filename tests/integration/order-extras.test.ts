import { beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, invitations, themes } from '@/server/db/schema';
import { syncThemesFromRegistry, transitionTheme, updateThemeSettings } from '@/server/catalog/themes';
import { createPackage } from '@/server/catalog/packages';
import { listPalettes, savePalette, setPaletteStatus } from '@/server/catalog/palettes';
import { createDraft, updateDraft } from '@/server/orders/drafts';
import { invitationRenderData } from '@/server/invitation/load';
import { invitationCards, printData, shapeSheet } from '@/server/documents/data';
import { updateCardOptions } from '@/server/documents/documents';
import { manifestSchema } from '@/theme-sdk/manifest';
import { storeImage } from '@/server/media/assets';
import { randomToken } from '@/lib/crypto';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { customerEditInvitation } from '@/server/invitation/customer-edit';
import { activeTheme, BASIC_FIELDS, testManifest, weddingValues } from '../fixtures';
import { ctx, uniqueKey } from '../helpers';

const SLOTS = [
  { key: 'background', label: { ar: 'الخلفية', en: 'Background' }, default: '#173b2f' },
  { key: 'accent', label: { ar: 'البارز', en: 'Accent' }, default: '#c9a45c' },
];

async function pngDataUrl(svg: string) {
  return `data:image/png;base64,${(await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64')}`;
}
const STROKE = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200"><path d="M20 150 C 120 20, 220 20, 320 150 S 520 280, 580 60" stroke="#111" stroke-width="6" fill="none"/></svg>';
const EMPTY = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200"></svg>';

let shop: { themeKey: string; themeId: string; packageId: string; adminId: string };

beforeAll(async () => {
  const base = await activeTheme(); // seeds, admin, music
  const actor = base.actor;
  const key = uniqueKey('extras');
  const features = ['music', 'rsvp', 'print_card', 'signature', 'color_choice'] as const;
  await syncThemesFromRegistry(
    db(),
    [testManifest(key, 1, { features: [...features], validStates: [{ features: [...features], fields: [...BASIC_FIELDS] }], fields: [...BASIC_FIELDS], colors: { slots: SLOTS } })],
    actor,
    { complete: false },
  );
  const [t] = await db().select().from(themes).where(eq(themes.key, key));
  const cover = await storeImage(db(), await sharp({ create: { width: 320, height: 420, channels: 3, background: '#bb8' } }).png().toBuffer(), { uploadedBy: null });
  await updateThemeSettings(db(), t!.id, { name: t!.name, sectionId: t!.sectionId, coverAssetId: cover.id, musicTrackId: base.song.id }, actor);
  const pkg = await createPackage(db(), t!.id, { name: { ar: 'كامل', en: 'Full' }, priceIqd: 50000, fieldKeys: [...BASIC_FIELDS], featureKeys: [...features] }, actor);
  await transitionTheme(db(), t!.id, 'READY_FOR_REVIEW', actor);
  await transitionTheme(db(), t!.id, 'ACTIVE', actor);
  shop = { themeKey: key, themeId: t!.id, packageId: pkg.id, adminId: base.admin.id };
});

const draft = (extras: Parameters<typeof createDraft>[1]['extras']) =>
  createDraft(db(), { themeKey: shop.themeKey, packageId: shop.packageId, locale: 'ar', values: weddingValues(), extras }, { ...ctx, ipHash: randomToken(8) });
const row = async (id: string) => (await db().select().from(invitations).where(eq(invitations.id, id)))[0]!;

describe('colour sets', () => {
  it('keeps only the theme slots, is audited, and can be stopped', async () => {
    const actor = { adminId: shop.adminId, ipHash: null };
    const id = await savePalette(db(), shop.themeId, { name: { ar: 'وردي', en: 'Rose' }, colors: { background: '#F4E1E6', accent: '#9a3b5a', stray: '#000000' } }, actor);
    const [p] = (await listPalettes(db(), shop.themeId)).filter((x) => x.id === id);
    expect(p!.colors).toEqual({ background: '#f4e1e6', accent: '#9a3b5a' });
    await setPaletteStatus(db(), shop.themeId, id, 'ARCHIVED', actor);
    expect((await listPalettes(db(), shop.themeId, { activeOnly: true })).some((x) => x.id === id)).toBe(false);
    const logs = await db().select().from(auditLogs).where(eq(auditLogs.objectId, shop.themeId));
    expect(logs.map((l) => l.action)).toEqual(expect.arrayContaining(['palette.create', 'palette.archive']));
  });

  it('a theme with color_choice must declare colour slots', () => {
    const m = testManifest('x-colors', 1, { features: ['music', 'color_choice'], validStates: [{ features: ['music', 'color_choice'], fields: [...BASIC_FIELDS] }], fields: [...BASIC_FIELDS] });
    expect(manifestSchema.safeParse(m).success).toBe(false);
    expect(manifestSchema.safeParse({ ...m, colors: { slots: SLOTS } }).success).toBe(true);
  });
});

describe('order extras', () => {
  it('stores the card back, the signature and the chosen colours, and the invitation and card use them', async () => {
    const paletteId = await savePalette(db(), shop.themeId, { name: { ar: 'أزرق', en: 'Blue' }, colors: { background: '#dde8f3', accent: '#2b4c7e' } }, { adminId: shop.adminId, ipHash: null });
    const d = await draft({ cardBack: { title: 'شكراً لكم', message: 'سعدنا بوجودكم' }, signature: await pngDataUrl(STROKE), paletteId });
    const inv = await row(d.invitationId);
    expect(inv.cardOptions).toMatchObject({ backTitle: 'شكراً لكم', backMessage: 'سعدنا بوجودكم' });
    expect(inv.signatureAssetId).not.toBeNull();
    expect(inv.colors).toEqual({ background: '#dde8f3', accent: '#2b4c7e' });

    const { props } = await invitationRenderData(db(), inv, 'preview');
    expect(props.signatures).toHaveLength(1);
    expect(props.signatures[0]!.src).toMatch(/\.webp$/);
    expect(props.colors).toEqual({ background: '#dde8f3', accent: '#2b4c7e' });

    const card = await printData(db(), inv, 'card');
    expect(card.kind === 'card' && card.back).toMatchObject({ title: 'شكراً لكم', message: 'سعدنا بوجودكم', colors: { accent: '#2b4c7e' } });
    expect(card.kind === 'card' && card.back.signatures).toHaveLength(1);

    // Admin card tweaks keep the customer's back.
    await updateCardOptions(db(), inv.id, { extraLine: 'دعوة عائلية' }, { adminId: shop.adminId, ipHash: null });
    expect((await row(inv.id)).cardOptions).toMatchObject({ extraLine: 'دعوة عائلية', backTitle: 'شكراً لكم' });

    // Before paying: remove the signature, back to the original colours, empty back = default title.
    await updateDraft(db(), d.previewToken, { values: weddingValues(), extras: { signature: 'none', paletteId: '', cardBack: { title: '', message: '' } } });
    const after = await row(inv.id);
    expect(after.signatureAssetId).toBeNull();
    expect(after.colors).toBeNull();
    const card2 = await printData(db(), after, 'card');
    expect(card2.kind === 'card' && card2.back.title).toBe('بكل الحب');
    expect((await invitationRenderData(db(), after, 'preview')).props.colors).toEqual({ background: '#173b2f', accent: '#c9a45c' });
  });

  it('takes two signatures side by side, and a lone second one becomes the first', async () => {
    const SECOND = STROKE.replace('M20 150', 'M40 120');
    const d = await draft({ signature: await pngDataUrl(STROKE), signature2: await pngDataUrl(SECOND) });
    const inv = await row(d.invitationId);
    expect(inv.signatureAssetId).not.toBeNull();
    expect(inv.signature2AssetId).not.toBeNull();
    expect((await invitationRenderData(db(), inv, 'preview')).props.signatures).toHaveLength(2);
    const card = await printData(db(), inv, 'card');
    expect(card.kind === 'card' && card.back.signatures).toHaveLength(2);

    // Back to one: the second is removed.
    await updateDraft(db(), d.previewToken, { values: weddingValues(), extras: { signature: 'keep', signature2: 'none' } });
    expect((await row(inv.id)).signature2AssetId).toBeNull();

    const lone = await draft({ signature: 'none', signature2: await pngDataUrl(SECOND) });
    const l = await row(lone.invitationId);
    expect(l.signatureAssetId).not.toBeNull();
    expect(l.signature2AssetId).toBeNull();
  });

  it('after publishing, the customer can redraw or add signatures as one of their edits', async () => {
    const d = await draft({ signature: await pngDataUrl(STROKE) });
    const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, { ...ctx, ipHash: randomToken(8) });
    await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
    const inv = await row(d.invitationId);
    await db().update(invitations).set({ featureKeys: [...inv.featureKeys, 'self_edit'] }).where(eq(invitations.id, inv.id));
    const result = await customerEditInvitation(db(), {
      receiptToken: o.receiptToken,
      values: inv.fieldValues,
      ipHash: null,
      signature: 'keep',
      signature2: await pngDataUrl(STROKE.replace('M20 150', 'M60 100')),
    });
    expect(result).toMatchObject({ ok: true, left: 2 });
    const after = await row(inv.id);
    expect(after.signatureAssetId).toBe(inv.signatureAssetId);
    expect(after.signature2AssetId).not.toBeNull();
  });

  it('refuses a too-long back, ignores an empty signature pad, and rejects unknown colour sets', async () => {
    await expect(draft({ cardBack: { title: 'x'.repeat(41), message: '' } })).rejects.toMatchObject({ code: 'invalidFields', fieldErrors: { cardBackTitle: 'tooLong' } });
    await expect(draft({ paletteId: '00000000-0000-4000-8000-000000000000' })).rejects.toMatchObject({ fieldErrors: { palette: 'invalid' } });
    const d = await draft({ signature: await pngDataUrl(EMPTY) });
    expect((await row(d.invitationId)).signatureAssetId).toBeNull();
  });
});

describe('changeable lines of a design (manifest wording)', () => {
  const WORDING = [
    { key: 'blessed', label: { ar: 'سطر التهنئة', en: 'Blessing line' }, ar: 'رزقنا الله بأجمل العطايا', versions: { en: 'Blessed with a son' }, maxLength: 30 },
    { key: 'sonOf', label: { ar: 'بن', en: 'Son of' }, ar: 'بن', versions: { en: 'Son of', ckb: 'کوڕی' }, defaultIn: ['en' as const], maxLength: 12 },
  ];
  let wshop: { themeKey: string; packageId: string };

  beforeAll(async () => {
    const base = await activeTheme();
    const key = uniqueKey('wording');
    await syncThemesFromRegistry(db(), [testManifest(key, 1, { wording: WORDING })], base.actor, { complete: false });
    const [t] = await db().select().from(themes).where(eq(themes.key, key));
    const cover = await storeImage(db(), await sharp({ create: { width: 320, height: 420, channels: 3, background: '#bb8' } }).png().toBuffer(), { uploadedBy: null });
    await updateThemeSettings(db(), t!.id, { name: t!.name, sectionId: t!.sectionId, coverAssetId: cover.id, musicTrackId: base.song.id }, base.actor);
    const pkg = await createPackage(db(), t!.id, { name: { ar: 'أساسي', en: 'Basic' }, priceIqd: 20000, fieldKeys: [...BASIC_FIELDS], featureKeys: ['print_card'] }, base.actor);
    await transitionTheme(db(), t!.id, 'READY_FOR_REVIEW', base.actor);
    await transitionTheme(db(), t!.id, 'ACTIVE', base.actor);
    wshop = { themeKey: key, packageId: pkg.id };
  });

  const order = (locale: 'ar' | 'en', wording?: Record<string, { choice: string; text: string }>) =>
    createDraft(db(), { themeKey: wshop.themeKey, packageId: wshop.packageId, locale, values: weddingValues(), extras: { wording } }, { ...ctx, ipHash: randomToken(8) });
  const shown = async (id: string) => (await invitationRenderData(db(), await row(id), 'preview')).props.wording;

  it('is Arabic by default in every language; the language version and the customer’s own words are choices', async () => {
    expect(await shown((await order('ar')).invitationId)).toEqual({ blessed: 'رزقنا الله بأجمل العطايا', sonOf: 'بن' });
    // `defaultIn`: English orders default to the line's English version.
    expect(await shown((await order('en')).invitationId)).toEqual({ blessed: 'رزقنا الله بأجمل العطايا', sonOf: 'Son of' });

    const d = await order('en', { blessed: { choice: 'lang', text: '' }, sonOf: { choice: 'ar', text: '' } });
    expect((await row(d.invitationId)).wording).toEqual({ blessed: 'Blessed with a son', sonOf: 'بن' });
    expect(await shown(d.invitationId)).toEqual({ blessed: 'Blessed with a son', sonOf: 'بن' });

    await updateDraft(db(), d.previewToken, { values: weddingValues(), extras: { wording: { blessed: { choice: 'custom', text: '  Our  little joy ' }, sonOf: { choice: 'lang', text: '' } } } });
    expect(await shown(d.invitationId)).toEqual({ blessed: 'Our little joy', sonOf: 'Son of' });

    await updateDraft(db(), d.previewToken, { values: weddingValues(), extras: { wording: { blessed: { choice: 'ar', text: 'ignored' } } } });
    expect((await row(d.invitationId)).wording).toEqual({});
  });

  it('refuses an empty or too-long own text, markup, and a language version that does not exist', async () => {
    const fails = async (locale: 'ar' | 'en', choice: string, text: string) =>
      (await order(locale, { blessed: { choice, text } }).catch((e: { fieldErrors?: Record<string, string> }) => e.fieldErrors))?.['w.blessed' as never];
    expect(await fails('en', 'custom', '   ')).toBe('required');
    expect(await fails('en', 'custom', 'x'.repeat(31))).toBe('tooLong');
    expect(await fails('en', 'custom', '<b>hi</b>')).toBe('invalidText');
    expect(await fails('ar', 'lang', '')).toBe('invalidChoice');
  });

  it('the manifest keeps keys unique and every text within its length', () => {
    const base = testManifest('wording-check', 1);
    expect(manifestSchema.safeParse({ ...base, wording: [...WORDING, ...WORDING] }).success).toBe(false);
    expect(manifestSchema.safeParse({ ...base, wording: [{ ...WORDING[0]!, maxLength: 5 }] }).success).toBe(false);
    expect(manifestSchema.safeParse({ ...base, wording: [{ ...WORDING[1]!, defaultIn: ['bdn'] }] }).success).toBe(false);
    expect(manifestSchema.safeParse({ ...base, wording: WORDING }).success).toBe(true);
  });
});

describe('fixed choices and yes/no switches of a design', () => {
  const ORDER = { key: 'order', label: { ar: 'ترتيب المولود', en: 'Birth order' }, ar: 'أوّل أفراحنا', options: ['ثاني أفراحنا', 'ثالث أفراحنا'], custom: false, maxLength: 20 };
  const SWITCH = { key: 'fatherOnExtras', label: { ar: 'اسم الأب على الملصقات', en: "Father's name on the stickers" }, default: false };
  let shop2: { themeKey: string; packageId: string };

  beforeAll(async () => {
    const base = await activeTheme();
    const key = uniqueKey('choices');
    await syncThemesFromRegistry(db(), [testManifest(key, 1, { wording: [ORDER], switches: [SWITCH] })], base.actor, { complete: false });
    const [t] = await db().select().from(themes).where(eq(themes.key, key));
    const cover = await storeImage(db(), await sharp({ create: { width: 320, height: 420, channels: 3, background: '#bb8' } }).png().toBuffer(), { uploadedBy: null });
    await updateThemeSettings(db(), t!.id, { name: t!.name, sectionId: t!.sectionId, coverAssetId: cover.id, musicTrackId: base.song.id }, base.actor);
    const pkg = await createPackage(db(), t!.id, { name: { ar: 'أساسي', en: 'Basic' }, priceIqd: 20000, fieldKeys: [...BASIC_FIELDS], featureKeys: ['print_card'] }, base.actor);
    await transitionTheme(db(), t!.id, 'READY_FOR_REVIEW', base.actor);
    await transitionTheme(db(), t!.id, 'ACTIVE', base.actor);
    shop2 = { themeKey: key, packageId: pkg.id };
  });

  const order = (extras: Parameters<typeof createDraft>[1]['extras']) =>
    createDraft(db(), { themeKey: shop2.themeKey, packageId: shop2.packageId, locale: 'ar', values: weddingValues(), extras }, { ...ctx, ipHash: randomToken(8) });
  const props = async (id: string) => (await invitationRenderData(db(), await row(id), 'preview')).props;

  it('defaults to the first choice and the switch default; stores only what differs', async () => {
    const plain = await order({});
    expect((await props(plain.invitationId)).wording).toEqual({ order: 'أوّل أفراحنا' });
    expect((await props(plain.invitationId)).switches).toEqual({ fatherOnExtras: false });

    const d = await order({ wording: { order: { choice: 'opt:1', text: '' } }, switches: { fatherOnExtras: true } });
    expect(await row(d.invitationId)).toMatchObject({ wording: { order: 'ثالث أفراحنا' }, switches: { fatherOnExtras: true } });
    expect((await props(d.invitationId)).switches).toEqual({ fatherOnExtras: true });

    await updateDraft(db(), d.previewToken, { values: weddingValues(), extras: { switches: { fatherOnExtras: false }, wording: { order: { choice: 'ar', text: '' } } } });
    expect(await row(d.invitationId)).toMatchObject({ wording: {}, switches: {} });
  });

  it('refuses own text where the design allows only its choices, and unknown options', async () => {
    const fails = async (choice: string) =>
      (await order({ wording: { order: { choice, text: 'my own' } } }).catch((e: { fieldErrors?: Record<string, string> }) => e.fieldErrors))?.['w.order' as never];
    expect(await fails('custom')).toBe('invalidChoice');
    expect(await fails('opt:7')).toBe('invalidChoice');
  });
});

describe('shaped printed cards (card_leaf, card_heart)', () => {
  const LEAF = { key: 'leaf', label: { ar: 'ورقة', en: 'Leaf' }, widthMm: 100, heightMm: 160, outline: 'M50 0 L100 80 L50 160 L0 80 Z' };
  /** The design's shapes in its own order (the order cards are listed in). */
  const SHAPE_ORDER = ['leaf', 'heart'];
  const HEART = { key: 'heart', label: { ar: 'قلب', en: 'Heart' }, widthMm: 120, heightMm: 120, outline: 'M60 20 L120 40 L60 120 L0 40 Z' };
  let shop3: { themeKey: string; withShapes: string; leafOnly: string; cardOnly: string };

  beforeAll(async () => {
    const base = await activeTheme();
    const key = uniqueKey('shapes');
    const features = ['print_card', 'card_leaf', 'card_heart'] as const;
    await syncThemesFromRegistry(
      db(),
      [testManifest(key, 1, { features: [...features], fields: [...BASIC_FIELDS], validStates: [{ features: [...features], fields: [...BASIC_FIELDS] }], print: { card: { size: 'A5', bleedMm: 3, qr: false }, shapes: [LEAF, HEART] } })],
      base.actor,
      { complete: false },
    );
    const [t] = await db().select().from(themes).where(eq(themes.key, key));
    const cover = await storeImage(db(), await sharp({ create: { width: 320, height: 420, channels: 3, background: '#bb8' } }).png().toBuffer(), { uploadedBy: null });
    await updateThemeSettings(db(), t!.id, { name: t!.name, sectionId: t!.sectionId, coverAssetId: cover.id, musicTrackId: base.song.id }, base.actor);
    const better = await createPackage(db(), t!.id, { name: { ar: 'مميز', en: 'Better' }, priceIqd: 40000, fieldKeys: [...BASIC_FIELDS], featureKeys: [...features] }, base.actor);
    const leaf = await createPackage(db(), t!.id, { name: { ar: 'ورقة', en: 'Leaf' }, priceIqd: 30000, fieldKeys: [...BASIC_FIELDS], featureKeys: ['print_card', 'card_leaf'] }, base.actor);
    const normal = await createPackage(db(), t!.id, { name: { ar: 'عادي', en: 'Normal' }, priceIqd: 20000, fieldKeys: [...BASIC_FIELDS], featureKeys: ['print_card'] }, base.actor);
    await transitionTheme(db(), t!.id, 'READY_FOR_REVIEW', base.actor);
    await transitionTheme(db(), t!.id, 'ACTIVE', base.actor);
    shop3 = { themeKey: key, withShapes: better.id, leafOnly: leaf.id, cardOnly: normal.id };
  });

  const order = (packageId: string, extras: Parameters<typeof createDraft>[1]['extras']) =>
    createDraft(db(), { themeKey: shop3.themeKey, packageId, locale: 'ar', values: weddingValues(), extras }, { ...ctx, ipHash: randomToken(8) });

  it('stores the chosen shape, prints it with its mirrored back and a cut line for print shops, and can go back to the card', async () => {
    const d = await order(shop3.withShapes, { cardChoices: ['leaf'] });
    expect((await row(d.invitationId)).cardChoices).toEqual(['leaf']);
    const data = await printData(db(), await row(d.invitationId), 'card');
    expect(data.kind === 'card' && data.shape).toMatchObject({
      key: 'leaf',
      sides: {
        front: { widthMm: 100, heightMm: 160, outline: LEAF.outline, page: { width: '120mm', height: '180mm' } },
        // Turned over: mirrored left-right.
        back: { widthMm: 100, heightMm: 160, outline: 'M50 0 L0 80 L50 160 L100 80 Z' },
      },
      cutLine: false,
    });
    // A back read sideways: turned over and a quarter turn, a landscape box with x and y swapped.
    expect(shapeSheet({ ...LEAF, backSideways: true }, 'card').sides.back).toEqual({
      widthMm: 160,
      heightMm: 100,
      outline: 'M0 50 L80 100 L160 50 L80 0 Z',
      page: { width: '180mm', height: '120mm' },
    });
    const shop = await printData(db(), await row(d.invitationId), 'cardBleed');
    expect(shop.kind === 'card' && shop.shape?.cutLine).toBe(true);

    await updateDraft(db(), d.previewToken, { values: weddingValues(), extras: { cardChoices: ['a5'] } });
    expect((await row(d.invitationId)).cardChoices).toEqual(['a5']);
    const card = await printData(db(), await row(d.invitationId), 'card');
    expect(card.kind === 'card' && card.shape).toBeNull();
  });

  it('refuses a shape the design does not have, and ignores the choice in a package without shapes', async () => {
    const err = await order(shop3.withShapes, { cardChoices: ['leaf', 'star'] }).then(
      () => undefined,
      (e: { fieldErrors?: Record<string, string> }) => e.fieldErrors,
    );
    expect(err?.cardChoices).toBe('invalid');
    // Nothing ticked: at least one card is needed.
    const none = await order(shop3.withShapes, { cardChoices: [] }).then(
      () => undefined,
      (e: { fieldErrors?: Record<string, string> }) => e.fieldErrors,
    );
    expect(none?.cardChoices).toBe('required');
    const plain = await order(shop3.cardOnly, { cardChoices: ['leaf'] });
    expect((await row(plain.invitationId)).cardChoices).toEqual(['a5']);
    expect(await invitationCards(db(), await row(plain.invitationId))).toEqual(['a5']);
  });

  it('sells each shape on its own: a leaf package offers the leaf, not the heart', async () => {
    const leaf = await order(shop3.leafOnly, { cardChoices: ['leaf'] });
    expect((await row(leaf.invitationId)).cardChoices).toEqual(['leaf']);
    const err = await order(shop3.leafOnly, { cardChoices: ['heart'] }).then(
      () => undefined,
      (e: { fieldErrors?: Record<string, string> }) => e.fieldErrors,
    );
    expect(err?.cardChoices).toBe('invalid');
    const heart = await order(shop3.withShapes, { cardChoices: ['heart'] });
    expect((await row(heart.invitationId)).cardChoices).toEqual(['heart']);
  });

  it('the customer can tick several cards, or all of them: each is its own file', async () => {
    // Ticked in any order; stored in the fixed order (the card first, then the design's shapes).
    const d = await order(shop3.withShapes, { cardChoices: ['heart', 'a5', 'leaf'] });
    const inv = await row(d.invitationId);
    expect(await invitationCards(db(), inv)).toEqual(['a5', ...SHAPE_ORDER]);
    for (const card of ['a5', 'leaf', 'heart']) {
      const data = await printData(db(), inv, 'card', { card });
      expect(data.kind === 'card' && (data.shape?.key ?? 'a5')).toBe(card);
    }
    // No choice given: the first ticked card.
    const first = await printData(db(), inv, 'card');
    expect(first.kind === 'card' && first.shape).toBeNull();
    // Two of three.
    const two = await order(shop3.withShapes, { cardChoices: ['leaf', 'heart'] });
    expect(await invitationCards(db(), await row(two.invitationId))).toEqual(SHAPE_ORDER);
    // A card that was not ticked is never printed: the first ticked one is.
    const other = await printData(db(), await row(two.invitationId), 'card', { card: 'a5' });
    expect(other.kind === 'card' && other.shape?.key).toBe(SHAPE_ORDER[0]);
  });

  it('a theme lists the feature of every shape it draws, and draws every shape it sells', () => {
    const issues = (features: ('print_card' | 'card_leaf' | 'card_heart' | 'card_arch')[], shapes: (typeof LEAF)[]) => {
      const m = testManifest('shapes-check', 1, {
        features,
        fields: [...BASIC_FIELDS],
        validStates: [{ features, fields: [...BASIC_FIELDS] }],
        print: { card: { size: 'A5', bleedMm: 3, qr: false }, ...(shapes.length ? { shapes } : {}) },
      });
      const r = manifestSchema.safeParse(m);
      return r.success ? [] : r.error.issues.map((i) => i.message);
    };
    expect(issues(['print_card', 'card_leaf'], [])).toContain('card_leaf requires a "leaf" (or "leaf-…") shape in print.shapes');
    expect(issues(['print_card', 'card_leaf'], [LEAF, HEART])).toContain('print.shapes "heart" is sold with the card_heart feature: list it in features');
    expect(issues(['print_card'], [{ ...LEAF, key: 'star' }])).toContain('print.shapes keys must be one of: leaf, heart, arch (or one of them followed by "-name")');
    expect(issues(['print_card', 'card_leaf', 'card_heart'], [LEAF, HEART])).toEqual([]);
    expect(issues(['print_card', 'card_arch'], [])).toContain('card_arch requires a "arch" (or "arch-…") shape in print.shapes');
    expect(issues(['print_card', 'card_heart', 'card_arch'], [HEART, { ...LEAF, key: 'arch' }])).toEqual([]);
    // Several frames of one kind, all sold by its feature.
    expect(issues(['print_card', 'card_arch'], [{ ...LEAF, key: 'arch-oval' }, { ...LEAF, key: 'arch-plaque' }])).toEqual([]);
    expect(issues(['print_card'], [{ ...LEAF, key: 'arch-oval' }])).toContain('print.shapes "arch" is sold with the card_arch feature: list it in features');
  });
});

describe('signature drawn again (strokes)', () => {
  // A short "signature": two strokes, the second after a long pause.
  const OTHER = STROKE.replace('M20 150', 'M60 110');
  const strokes = { w: 600, h: 200, s: [[20, 150, 0, 120, 60, 120, 220, 60, 240, 320, 150, 400], [400, 150, 3000, 560, 60, 3300]] };

  it('keeps how a new signature was drawn, for the online invitation only', async () => {
    const d = await draft({ signature: await pngDataUrl(STROKE), signatureStrokes: JSON.stringify(strokes) });
    const inv = await row(d.invitationId);
    expect(inv.signatureStrokes).toEqual(strokes);
    // The invitation (and its preview) draw it again…
    const live = await invitationRenderData(db(), inv, 'preview', { drawSignatures: true });
    expect(live.props.signatures[0]).toMatchObject({ strokes });
    // …pictures and print show it finished.
    expect((await invitationRenderData(db(), inv, 'live')).props.signatures[0]).not.toHaveProperty('strokes');
    const card = await printData(db(), inv, 'card');
    expect(card.kind === 'card' && card.back.signatures[0]).not.toHaveProperty('strokes');

    // Keeping the signature keeps its strokes; a bad recording is dropped (the signature then just appears).
    await updateDraft(db(), d.previewToken, { values: weddingValues(), extras: { signature: 'keep' } });
    expect((await row(inv.id)).signatureStrokes).toEqual(strokes);
    await updateDraft(db(), d.previewToken, { values: weddingValues(), extras: { signature: await pngDataUrl(OTHER), signatureStrokes: '{"w":1,"h":1,"s":[[1,2]]}' } });
    expect((await row(inv.id)).signatureStrokes).toBeNull();
    // An older signature without strokes appears (fades in) on the invitation.
    expect((await invitationRenderData(db(), await row(inv.id), 'preview', { drawSignatures: true })).props.signatures[0]).toMatchObject({ strokes: null });

    // Removing the signature removes its strokes.
    await updateDraft(db(), d.previewToken, { values: weddingValues(), extras: { signature: await pngDataUrl(STROKE), signatureStrokes: JSON.stringify(strokes) } });
    await updateDraft(db(), d.previewToken, { values: weddingValues(), extras: { signature: 'none' } });
    expect((await row(inv.id)).signatureStrokes).toBeNull();
  });

  it('a lone second signature moves to first with its strokes', async () => {
    const d = await draft({ signature: 'none', signature2: await pngDataUrl(OTHER), signature2Strokes: JSON.stringify(strokes) });
    const inv = await row(d.invitationId);
    expect(inv.signatureStrokes).toEqual(strokes);
    expect(inv.signature2Strokes).toBeNull();
  });
});

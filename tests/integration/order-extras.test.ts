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
import { printData } from '@/server/documents/data';
import { updateCardOptions } from '@/server/documents/documents';
import { manifestSchema } from '@/theme-sdk/manifest';
import { storeImage } from '@/server/media/assets';
import { randomToken } from '@/lib/crypto';
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
    expect(props.signature?.src).toMatch(/\.webp$/);
    expect(props.colors).toEqual({ background: '#dde8f3', accent: '#2b4c7e' });

    const card = await printData(db(), inv, 'card');
    expect(card.kind === 'card' && card.back).toMatchObject({ title: 'شكراً لكم', message: 'سعدنا بوجودكم', colors: { accent: '#2b4c7e' } });
    expect(card.kind === 'card' && card.back.signature?.src).toBeTruthy();

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

  it('refuses a too-long back, ignores an empty signature pad, and rejects unknown colour sets', async () => {
    await expect(draft({ cardBack: { title: 'x'.repeat(41), message: '' } })).rejects.toMatchObject({ code: 'invalidFields', fieldErrors: { cardBackTitle: 'tooLong' } });
    await expect(draft({ paletteId: '00000000-0000-4000-8000-000000000000' })).rejects.toMatchObject({ fieldErrors: { palette: 'invalid' } });
    const d = await draft({ signature: await pngDataUrl(EMPTY) });
    expect((await row(d.invitationId)).signatureAssetId).toBeNull();
  });
});

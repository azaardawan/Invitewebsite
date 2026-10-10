import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { invitations, sections, subsections } from '@/server/db/schema';
import { setSubsectionStatus, updateSubsection } from '@/server/catalog/subsections';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { validateFieldValues, baghdadToday } from '@/server/orders/validation';
import { ensureProductFile, ProductError } from '@/server/products/files';
import { productData } from '@/server/products/data';
import { seedCatalog } from '@/server/catalog/seed';
import { randomToken } from '@/lib/crypto';
import { invitationNames } from '@/catalog/fields';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

const defs = new Map([
  ['baby_gender', { type: 'choice', maxLength: null }],
  ['birth_date', { type: 'birthdate', maxLength: null }],
]);
const day = (offset: number) => baghdadToday(new Date(Date.now() + offset * 86400_000));

describe('newborn details', () => {
  it('accept boy or girl and a real date of birth (past, or an expected one this year)', () => {
    expect(validateFieldValues({ baby_gender: 'girl', birth_date: day(-20) }, ['baby_gender', 'birth_date'], defs)).toEqual({ ok: true, values: { baby_gender: 'girl', birth_date: day(-20) } });
    expect(validateFieldValues({ baby_gender: 'girl', birth_date: day(60) }, ['baby_gender', 'birth_date'], defs).ok).toBe(true);
    expect(validateFieldValues({ baby_gender: 'twins', birth_date: day(-5 * 365) }, ['baby_gender', 'birth_date'], defs)).toEqual({ ok: false, errors: { baby_gender: 'invalidChoice', birth_date: 'birthTooFar' } });
    expect(validateFieldValues({ baby_gender: 'boy', birth_date: '2026-02-30' }, ['baby_gender', 'birth_date'], defs)).toMatchObject({ errors: { birth_date: 'invalidDate' } });
  });

  it('name the invitation after the baby when there is no couple', () => {
    expect(invitationNames({ baby_name: 'ليان' })).toEqual(['ليان']);
    expect(invitationNames({ person_1_name: 'علي', person_2_name: 'نور', baby_name: 'x' })).toEqual(['علي', 'نور']);
  });

  it('come with a newborn occasion whose extras start ticked', async () => {
    await seedCatalog(db());
    const [s] = await db().select().from(sections).where(eq(sections.key, 'newborn'));
    expect(s!.name).toMatchObject({ ar: 'مولود جديد', en: 'Newborn baby' });
    expect(s!.requiredFeatures).toEqual(expect.arrayContaining(['story', 'sticker', 'bottle_label', 'print_card']));
  });

  it('come with Boy and Girl groups, added once and never overwriting the owner', async () => {
    await seedCatalog(db());
    const [s] = await db().select().from(sections).where(eq(sections.key, 'newborn'));
    const subs = async () => (await db().select().from(subsections).where(eq(subsections.sectionId, s!.id))).sort((a, b) => a.sortOrder - b.sortOrder);
    const first = await subs();
    expect(first.filter((x) => x.key === 'boy' || x.key === 'girl').map((x) => [x.key, x.name.ar])).toEqual([
      ['boy', 'ولد'],
      ['girl', 'بنت'],
    ]);
    const girl = first.find((x) => x.key === 'girl')!;
    await updateSubsection(db(), girl.id, { name: { ar: 'بنات', en: 'Girls' } }, shop.actor);
    await setSubsectionStatus(db(), girl.id, 'ARCHIVED', shop.actor);
    await seedCatalog(db());
    const again = await subs();
    expect(again).toHaveLength(first.length);
    expect(again.find((x) => x.key === 'girl')).toMatchObject({ status: 'ARCHIVED', name: { ar: 'بنات', en: 'Girls' } });
    await setSubsectionStatus(db(), girl.id, 'ACTIVE', shop.actor);
  });
});

describe('newborn extras', () => {
  async function order(paid: boolean, stickerShape?: string) {
    const visitor = { ...ctx, ipHash: randomToken(8) };
    const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues() }, visitor);
    if (paid) {
      const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
      await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
    }
    // The test package doesn't sell extras: switch them on for this invitation.
    const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
    await db()
      .update(invitations)
      .set({ featureKeys: [...inv!.featureKeys, 'story', 'sticker'], ...(stickerShape ? { stickerShape: stickerShape as 'square' } : {}) })
      .where(eq(invitations.id, d.invitationId));
    return d.invitationId;
  }
  const fake = () => {
    const calls: string[] = [];
    return { calls, render: async (item: string) => (calls.push(item), Buffer.from(`fake ${item}`)) };
  };

  it('are previewed with a watermark before payment, and their files are kept back until then', async () => {
    const id = await order(false, 'square');
    const [inv] = await db().select().from(invitations).where(eq(invitations.id, id));
    const data = await productData(db(), inv!);
    expect(data).toMatchObject({ watermark: true, stickerShape: 'square' });
    const r = fake();
    expect((await ensureProductFile(db(), id, 'story.preview', r.render)).type).toBe('image/jpeg');
    await ensureProductFile(db(), id, 'story.preview', r.render);
    expect(r.calls).toEqual(['story.preview']); // reused while unchanged
    await expect(ensureProductFile(db(), id, 'story.png', r.render)).rejects.toMatchObject({ code: 'notPaid' });
    await expect(ensureProductFile(db(), id, 'bottle.preview', r.render)).rejects.toBeInstanceOf(ProductError);
  });

  it('come clean once paid (the stored preview is redrawn without the watermark)', async () => {
    const id = await order(true);
    const [inv] = await db().select().from(invitations).where(eq(invitations.id, id));
    expect((await productData(db(), inv!)).watermark).toBe(false);
    const r = fake();
    const sheet = await ensureProductFile(db(), id, 'sticker.pdf', r.render);
    expect(sheet).toMatchObject({ type: 'application/pdf', fileName: expect.stringMatching(/^stickers-sheet-.+\.pdf$/) });
    expect((await ensureProductFile(db(), id, 'story.png', r.render)).type).toBe('image/png');
    expect(r.calls).toEqual(['sticker.pdf', 'story.png']);
  });
});

describe('the extras design in Admin', () => {
  it('shares one look across the set, and lets each item have its own layout, details and colours', async () => {
    const { updateThemeCardSide, updateThemeExtrasLook, themeArtwork } = await import('@/server/catalog/card-design');
    const actor = { adminId: shop.admin.id, ipHash: null };
    await updateThemeExtrasLook(db(), shop.theme.id, { paper: '#fff8f0', ink: '#222222', accent: '#7a1f3d', headingFont: 'vazir', bodyFont: 'sans', babyColours: false }, actor);
    const style = { ink: '#111111', accent: '#004466', headingFont: 'ruqaa', bodyFont: 'sans', align: 'center', insetMm: 6, scale: 100 } as const;
    // Settings only, no artwork: kept for an extra.
    await updateThemeCardSide(db(), shop.theme.id, 'sticker', { ...style, assetId: null, layout: 'badge', show: { gender: true, date: false, parents: false, quote: false }, ownLook: true, paper: '#eeeeee' }, actor);
    await expect(updateThemeCardSide(db(), shop.theme.id, 'story', { ...style, assetId: null, layout: 'nope' }, actor)).rejects.toMatchObject({ code: 'invalid' });
    const art = await themeArtwork(db(), shop.theme.id);
    expect(art.look).toMatchObject({ accent: '#7a1f3d', headingFont: 'vazir' });
    expect(art.sticker).toMatchObject({ src: '', layout: 'badge', ownLook: true, paper: '#eeeeee', show: { date: false } });
    expect(art.story).toBeNull();

    const id = (await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues() }, { ...ctx, ipHash: randomToken(8) })).invitationId;
    const [inv] = await db().select().from(invitations).where(eq(invitations.id, id));
    const data = await productData(db(), inv!);
    expect(data.look).toMatchObject({ paper: '#fff8f0', accent: '#7a1f3d' });
    expect(data.design.sticker?.layout).toBe('badge');

    await updateThemeCardSide(db(), shop.theme.id, 'sticker', { ...style, assetId: null }, actor, { remove: true });
    await updateThemeExtrasLook(db(), shop.theme.id, null, actor);
    expect(await themeArtwork(db(), shop.theme.id)).toMatchObject({ sticker: null, look: null });
  });
});

import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { invitations, sections } from '@/server/db/schema';
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

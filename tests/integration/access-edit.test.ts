import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { db } from '@/server/db/client';
import { auditLogs, invitations, orders, themes } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { ACCESS_RATE_LIMIT, backfillAccessCodes, lookupAccessCode } from '@/server/orders/access';
import { accessCodeFor, formatAccessCode, normalizeAccessCode, receiptTokenFor } from '@/server/orders/tokens';
import { SELF_EDIT_LIMIT, customerEditInvitation } from '@/server/invitation/customer-edit';
import { invitationRenderData } from '@/server/invitation/load';
import { themeBorder, updateThemeBorder } from '@/server/catalog/border';
import { storeImage } from '@/server/media/assets';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

async function paidOrder() {
  const visitor = { ...ctx, ipHash: randomToken(8) };
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues() }, visitor);
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
  await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  return { ...o, invitationId: d.invitationId };
}

describe('invitation number ("My invitation")', () => {
  it('normalizes what customers type, including Arabic-Indic digits', () => {
    expect(normalizeAccessCode('482 199 3015')).toBe('4821993015');
    expect(normalizeAccessCode('٤٨٢-١٩٩-٣٠١٥')).toBe('4821993015');
    expect(normalizeAccessCode('۴۸۲۱۹۹۳۰۱۵')).toBe('4821993015');
    expect(normalizeAccessCode('12345')).toBeNull();
    expect(formatAccessCode('4821993015')).toBe('482 199 3015');
  });

  it('opens the customer receipt from the number, with a guess limit', async () => {
    const o = await paidOrder();
    const code = accessCodeFor(o.orderId);
    expect(code).toMatch(/^\d{10}$/);
    expect(await lookupAccessCode(db(), formatAccessCode(code), randomToken(8))).toEqual({ ok: true, receiptToken: o.receiptToken });
    expect(await lookupAccessCode(db(), 'abc', randomToken(8))).toEqual({ ok: false, error: 'invalid' });

    const ip = randomToken(8);
    const wrong = code === '0000000000' ? '0000000001' : '0000000000';
    for (let i = 0; i < ACCESS_RATE_LIMIT.perIpPerHour; i++) expect((await lookupAccessCode(db(), wrong, ip)).ok).toBe(false);
    expect(await lookupAccessCode(db(), code, ip)).toEqual({ ok: false, error: 'rateLimited' });
  });

  it('gives older orders their number on deploy', async () => {
    const o = await paidOrder();
    await db().update(orders).set({ accessCodeHash: null }).where(eq(orders.id, o.orderId));
    expect(await backfillAccessCodes(db())).toBeGreaterThanOrEqual(1);
    expect(await lookupAccessCode(db(), accessCodeFor(o.orderId), randomToken(8))).toEqual({ ok: true, receiptToken: receiptTokenFor(o.orderId) });
  });
});

describe('customer edits after publishing (self_edit)', () => {
  it('only packages with self_edit, up to the limit, validated and audited', async () => {
    const o = await paidOrder();
    const edit = (values: Record<string, unknown>) => customerEditInvitation(db(), { receiptToken: o.receiptToken, values, ipHash: randomToken(8) });
    const [inv] = await db().select().from(invitations).where(eq(invitations.id, o.invitationId));
    expect(await edit({ ...inv!.fieldValues, person_1_name: 'سامر' })).toEqual({ ok: false, error: 'notAllowed' });

    await db().update(invitations).set({ featureKeys: [...inv!.featureKeys, 'self_edit'] }).where(eq(invitations.id, inv!.id));
    expect(await edit({ ...inv!.fieldValues, person_1_name: '' })).toMatchObject({ ok: false, error: 'invalidFields', fieldErrors: { person_1_name: 'required' } });
    for (let i = 1; i <= SELF_EDIT_LIMIT; i++) {
      expect(await edit({ ...inv!.fieldValues, person_1_name: `سامر ${i}` })).toEqual({ ok: true, left: SELF_EDIT_LIMIT - i });
    }
    expect(await edit({ ...inv!.fieldValues, person_1_name: 'آخر' })).toEqual({ ok: false, error: 'limitReached' });

    const [after] = await db().select().from(invitations).where(eq(invitations.id, inv!.id));
    expect(after!.fieldValues.person_1_name).toBe(`سامر ${SELF_EDIT_LIMIT}`);
    expect(after!.selfEdits).toBe(SELF_EDIT_LIMIT);
    const logs = await db().select().from(auditLogs).where(eq(auditLogs.objectId, inv!.id));
    expect(logs.filter((l) => l.action === 'invitation.customer_edited')).toHaveLength(SELF_EDIT_LIMIT);
    expect(await customerEditInvitation(db(), { receiptToken: 'not-a-token', values: {}, ipHash: null })).toEqual({ ok: false, error: 'notFound' });
  });
});

describe('theme border', () => {
  it('replaces the border on invitations (and back), audited', async () => {
    const o = await paidOrder();
    const [inv] = await db().select().from(invitations).where(eq(invitations.id, o.invitationId));
    expect((await invitationRenderData(db(), inv!, 'live')).props.border).toBeNull();

    const png = await sharp({ create: { width: 240, height: 600, channels: 4, background: { r: 160, g: 80, b: 50, alpha: 0.8 } } }).png().toBuffer();
    const asset = await storeImage(db(), png, { uploadedBy: null });
    const actor = { adminId: shop.admin.id, ipHash: null };
    await updateThemeBorder(db(), shop.theme.id, { assetId: asset.id, kind: 'strips', size: 20 }, actor);
    const border = (await invitationRenderData(db(), inv!, 'live')).props.border;
    expect(border).toMatchObject({ kind: 'strips', size: 20 });
    expect(border!.src).toContain(asset.storageKey);

    await updateThemeBorder(db(), shop.theme.id, { assetId: null, kind: 'strips', size: 20 }, actor);
    expect(await themeBorder(db(), shop.theme.id)).toBeNull();
    const [t] = await db().select().from(themes).where(eq(themes.id, shop.theme.id));
    expect(t!.borderAssetId).toBeNull();
    const logs = await db().select().from(auditLogs).where(eq(auditLogs.objectId, shop.theme.id));
    expect(logs.filter((l) => l.action === 'theme.border_updated')).toHaveLength(2);
  });
});

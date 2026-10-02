import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, invitations } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { listGuestResponses, setGuestMessageStatus, submitGuestResponse } from '@/server/guests/responses';
import { setPublicGuestbook } from '@/server/guests/guestbook';
import { invitationRenderData } from '@/server/invitation/load';
import { buildThemeProps } from '@/server/invitation/theme-props';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

async function published(withMessages = true) {
  const visitor = { ...ctx, ipHash: randomToken(8) };
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues() }, visitor);
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
  await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
  if (withMessages) await db().update(invitations).set({ featureKeys: [...inv!.featureKeys, 'congratulations'] }).where(eq(invitations.id, inv!.id));
  return (await db().select().from(invitations).where(eq(invitations.id, d.invitationId)))[0]!;
}
const write = (id: string, name: string, message: string) =>
  submitGuestResponse(db(), { invitationId: id, response: { name, attendance: 'ATTENDING', message }, ipHash: randomToken(8), clientToken: randomToken(24) });
const reload = async (id: string) => (await db().select().from(invitations).where(eq(invitations.id, id)))[0]!;

describe('public guest messages', () => {
  it('are private by default and shown newest first once the customer makes them public', async () => {
    const inv = await published();
    await write(inv.id, 'سارة', 'ألف مبروك');
    await write(inv.id, 'أحمد', 'بالرفاه والبنين');
    expect((await invitationRenderData(db(), await reload(inv.id), 'live')).props.guestbook).toBeNull();

    expect(await setPublicGuestbook(db(), inv.id, true, { type: 'CUSTOMER', ipHash: null })).toBe(true);
    const shown = (await invitationRenderData(db(), await reload(inv.id), 'live')).props.guestbook;
    expect(shown?.map((m) => m.guestName)).toEqual(['أحمد', 'سارة']);

    // A message the team hides disappears from the public list.
    const [first] = await listGuestResponses(db(), inv.id);
    await setGuestMessageStatus(db(), first!.id, 'HIDDEN', { adminId: shop.admin.id, ipHash: null });
    expect((await invitationRenderData(db(), await reload(inv.id), 'live')).props.guestbook?.map((m) => m.guestName)).toEqual(['أحمد']);

    // The customer's preview page never shows them (only the live invitation does).
    expect((await invitationRenderData(db(), await reload(inv.id), 'preview')).props.guestbook).toBeNull();
    const actions = (await db().select().from(auditLogs).where(eq(auditLogs.objectId, inv.id))).map((a) => a.action);
    expect(actions).toContain('guestbook.made_public');
  });

  it('shows an empty list (not nothing) when public but nobody wrote yet, and can be made private again', async () => {
    const inv = await published();
    await setPublicGuestbook(db(), inv.id, true, { type: 'ADMIN', adminId: shop.admin.id, ipHash: null });
    expect((await invitationRenderData(db(), await reload(inv.id), 'live')).props.guestbook).toEqual([]);
    await setPublicGuestbook(db(), inv.id, false, { type: 'ADMIN', adminId: shop.admin.id, ipHash: null });
    expect((await invitationRenderData(db(), await reload(inv.id), 'live')).props.guestbook).toBeNull();
  });

  it('is not available for packages without messages', async () => {
    const inv = await published(false);
    expect(await setPublicGuestbook(db(), inv.id, true, { type: 'CUSTOMER', ipHash: null })).toBe(false);
    expect((await reload(inv.id)).publicGuestbook).toBe(false);
  });

  it('theme samples include example messages so designs can show the section', () => {
    const sample = buildThemeProps({ mode: 'sample', locale: 'ar', fieldKeys: ['person_1_name'], features: ['rsvp', 'congratulations'], values: { person_1_name: 'علي' }, musicSrc: null });
    expect(sample.guestbook?.length).toBe(3);
    const noMessages = buildThemeProps({ mode: 'sample', locale: 'ar', fieldKeys: ['person_1_name'], features: ['rsvp'], values: { person_1_name: 'علي' }, musicSrc: null });
    expect(noMessages.guestbook).toBeNull();
  });
});

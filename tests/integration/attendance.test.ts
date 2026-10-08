import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, invitations } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { submitGuestResponse } from '@/server/guests/responses';
import { attendanceCounts, setPublicAttendance } from '@/server/guests/attendance';
import { invitationRenderData } from '@/server/invitation/load';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

async function liveInvitation(packageId: string) {
  const visitor = { ...ctx, ipHash: randomToken(8) };
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId, locale: 'ar', values: weddingValues() }, visitor);
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
  await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
  return inv!;
}

const reply = (invitationId: string, name: string, attendance: 'ATTENDING' | 'NOT_ATTENDING', clientToken = randomToken(24)) =>
  submitGuestResponse(db(), { invitationId, response: { name, attendance }, ipHash: randomToken(8), clientToken });

describe('showing how many guests are coming', () => {
  it('counts each guest once, stays private by default, and shows on the invitation once the customer chooses', async () => {
    const inv = await liveInvitation(shop.full.id);
    const sara = randomToken(24);
    await reply(inv.id, 'سارة', 'NOT_ATTENDING', sara);
    await reply(inv.id, 'سارة', 'ATTENDING', sara); // changed her mind: still one guest
    await reply(inv.id, 'أحمد', 'ATTENDING');
    await reply(inv.id, 'ليلى', 'NOT_ATTENDING');
    expect(await attendanceCounts(db(), inv.id)).toEqual({ attending: 2, notAttending: 1 });

    expect((await invitationRenderData(db(), inv, 'live')).props.attendance).toBeNull();

    expect(await setPublicAttendance(db(), inv.id, true, { type: 'CUSTOMER', ipHash: null })).toBe(true);
    const [fresh] = await db().select().from(invitations).where(eq(invitations.id, inv.id));
    expect((await invitationRenderData(db(), fresh!, 'live')).props.attendance).toEqual({ attending: 2, notAttending: 1 });
    // Previews never show real replies.
    expect((await invitationRenderData(db(), fresh!, 'preview')).props.attendance).toBeNull();

    const logs = await db().select().from(auditLogs).where(eq(auditLogs.objectId, inv.id));
    expect(logs.some((l) => l.action === 'attendance.made_public' && l.actorType === 'CUSTOMER')).toBe(true);
  });

  it('is only for packages with the guest form', async () => {
    const inv = await liveInvitation(shop.basic.id);
    expect(await setPublicAttendance(db(), inv.id, true, { type: 'CUSTOMER', ipHash: null })).toBe(false);
  });
});

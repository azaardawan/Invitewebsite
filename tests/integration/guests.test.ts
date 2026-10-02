import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, guestResponses, invitations } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { GUEST_RATE_LIMITS, guestResponseCounts, listGuestResponses, setGuestMessageStatus, submitGuestResponse } from '@/server/guests/responses';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

/** A published invitation; `packageId` defaults to the package with the guest form. */
async function published(packageId = shop.full.id) {
  const visitor = { ...ctx, ipHash: randomToken(8) };
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId, locale: 'ar', values: weddingValues() }, visitor);
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
  await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
  return inv!;
}

const submit = (invitationId: string, response: { name: string; attendance: 'ATTENDING' | 'NOT_ATTENDING' | null; message?: string }, clientToken = randomToken(24)) =>
  submitGuestResponse(db(), { invitationId, response, ipHash: randomToken(8), clientToken });

describe('guest responses', () => {
  it('stores replies; the same name from the same phone corrects it, other names on a shared phone add their own', async () => {
    const inv = await published();
    const phone = randomToken(24);
    expect(await submit(inv.id, { name: '  أحمد علي ', attendance: 'ATTENDING' }, phone)).toEqual({ ok: true });
    expect(await submit(inv.id, { name: 'أحمد   علي', attendance: 'NOT_ATTENDING' }, phone)).toEqual({ ok: true }); // correction
    expect(await submit(inv.id, { name: 'سارة', attendance: 'ATTENDING' }, phone)).toEqual({ ok: true }); // family member, same phone
    expect(await submit(inv.id, { name: 'ليلى', attendance: 'ATTENDING' })).toEqual({ ok: true });

    const rows = await listGuestResponses(db(), inv.id);
    expect(rows.map((r) => [r.guestName, r.attendance])).toEqual([
      ['أحمد   علي', 'NOT_ATTENDING'],
      ['سارة', 'ATTENDING'],
      ['ليلى', 'ATTENDING'],
    ]);
    // Without `congratulations` no message is stored, even if one is sent.
    expect(rows.every((r) => r.message === null)).toBe(true);
    expect(rows.every((r) => r.clientTokenHash !== phone)).toBe(true);
    expect(await guestResponseCounts(db(), inv.id)).toEqual({ attending: 2, notAttending: 1 });
  });

  it('rejects missing or too-long values', async () => {
    const inv = await published();
    expect(await submit(inv.id, { name: ' ', attendance: 'ATTENDING' })).toEqual({ ok: false, error: 'invalid' });
    expect(await submit(inv.id, { name: 'x'.repeat(81), attendance: 'ATTENDING' })).toEqual({ ok: false, error: 'invalid' });
    expect(await submit(inv.id, { name: 'سارة', attendance: null })).toEqual({ ok: false, error: 'invalid' });
  });

  it('requires a message exactly when the package has congratulations', async () => {
    const inv = await published();
    await db()
      .update(invitations)
      .set({ featureKeys: [...inv.featureKeys, 'congratulations'] })
      .where(eq(invitations.id, inv.id));
    expect(await submit(inv.id, { name: 'سارة', attendance: 'ATTENDING' })).toEqual({ ok: false, error: 'invalid' });
    expect(await submit(inv.id, { name: 'سارة', attendance: 'ATTENDING', message: 'y'.repeat(501) })).toEqual({ ok: false, error: 'invalid' });
    expect(await submit(inv.id, { name: 'سارة', attendance: 'ATTENDING', message: 'ألف مبروك' })).toEqual({ ok: true });
    expect((await listGuestResponses(db(), inv.id))[0]?.message).toBe('ألف مبروك');
  });

  it('only live invitations with the guest form accept answers', async () => {
    const noForm = await published(shop.basic.id);
    expect(await submit(noForm.id, { name: 'سارة', attendance: 'ATTENDING' })).toEqual({ ok: false, error: 'closed' });

    const expired = await published();
    await db().update(invitations).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(invitations.id, expired.id));
    expect(await submit(expired.id, { name: 'سارة', attendance: 'ATTENDING' })).toEqual({ ok: false, error: 'closed' });

    const unpublished = await published();
    await db().update(invitations).set({ status: 'UNPUBLISHED' }).where(eq(invitations.id, unpublished.id));
    expect(await submit(unpublished.id, { name: 'سارة', attendance: 'ATTENDING' })).toEqual({ ok: false, error: 'closed' });

    expect(await submit(crypto.randomUUID(), { name: 'سارة', attendance: 'ATTENDING' })).toEqual({ ok: false, error: 'closed' });
  });

  it('rate-limits one visitor', async () => {
    const inv = await published();
    const ipHash = randomToken(8);
    const send = () => submitGuestResponse(db(), { invitationId: inv.id, response: { name: 'سارة', attendance: 'ATTENDING' }, ipHash, clientToken: randomToken(24) });
    for (let i = 0; i < GUEST_RATE_LIMITS.perIpPerHour; i++) expect(await send()).toEqual({ ok: true });
    expect(await send()).toEqual({ ok: false, error: 'rateLimited' });
  });

  it('hides and restores a message with an audit entry that does not copy the text', async () => {
    const inv = await published();
    await db()
      .update(invitations)
      .set({ featureKeys: [...inv.featureKeys, 'congratulations'] })
      .where(eq(invitations.id, inv.id));
    await submit(inv.id, { name: 'سارة', attendance: 'ATTENDING', message: 'رسالة خاصة' });
    const [r] = await listGuestResponses(db(), inv.id);
    const actor = { adminId: shop.admin.id, ipHash: null };

    await setGuestMessageStatus(db(), r!.id, 'HIDDEN', actor);
    expect((await db().select().from(guestResponses).where(eq(guestResponses.id, r!.id)))[0]?.messageStatus).toBe('HIDDEN');
    await setGuestMessageStatus(db(), r!.id, 'VISIBLE', actor);

    const logs = await db().select().from(auditLogs).where(eq(auditLogs.objectId, r!.id));
    expect(logs.map((l) => l.action).sort()).toEqual(['guest_message.hide', 'guest_message.restore']);
    expect(JSON.stringify(logs)).not.toContain('رسالة خاصة');
  });
});

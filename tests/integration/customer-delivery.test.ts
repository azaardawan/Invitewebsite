import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { orders } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { deliverPaidOrders, type WhatsAppSender } from '@/server/notify/customer';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

async function paidOrder(locale: 'ar' | 'en' = 'ar') {
  const visitor = { ...ctx, ipHash: randomToken(8) };
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale, values: weddingValues() }, visitor);
  const o = await createOrder(
    db(),
    { previewToken: d.previewToken, customer: { name: 'حسين علي', phone: '07701234567', email: 'b@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) },
    visitor,
  );
  await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  return o;
}

/** Runs the job until nothing is left: other tests' paid orders wait too, and each run takes the 20 oldest. */
async function deliverAll(opts: Parameters<typeof deliverPaidOrders>[1]) {
  while ((await deliverPaidOrders(db(), opts)).delivered > 0);
}

function recorder() {
  const sent: { to: string; lang: string; name: string; params: string[] }[] = [];
  const send: WhatsAppSender = async (to, lang, t) => {
    sent.push({ to, lang, ...t });
    return true;
  };
  const warmed: string[] = [];
  const warm = async (id: string) => void warmed.push(id);
  return { sent, send, warmed, warm };
}

describe('after payment, the customer gets their links on WhatsApp', () => {
  it('sends their page and the invitation link once, and draws the link-preview picture', async () => {
    const o = await paidOrder();
    const r = recorder();
    await deliverAll({ send: r.send, warm: r.warm, enabled: true });
    const mine = r.sent.filter((m) => m.params.some((p) => p.includes(o.receiptToken)));
    expect(mine).toEqual([{ to: '+9647701234567', lang: 'ar', name: 'bahja_customer_page', params: ['حسين', `http://localhost:3000/r/${o.receiptToken}`] }]);
    const [order] = await db().select().from(orders).where(eq(orders.id, o.orderId));
    expect(order!.deliveredAt).not.toBeNull();
    const invitationLink = r.sent[r.sent.indexOf(mine[0]!) + 1]!;
    expect(invitationLink).toMatchObject({ to: '+9647701234567', name: 'bahja_invitation_link' });
    expect(invitationLink.params[0]).toMatch(/^http:\/\/localhost:3000\/i\//);
    expect(r.warmed).toContain(order!.invitationId);

    // A second run (or another replica) never sends again.
    const again = recorder();
    await deliverAll({ send: again.send, warm: again.warm, enabled: true });
    expect(again.sent.filter((m) => m.params.some((p) => p.includes(o.receiptToken)))).toHaveLength(0);
  });

  it('English invitations get the English templates', async () => {
    const o = await paidOrder('en');
    const r = recorder();
    await deliverAll({ send: r.send, warm: r.warm, enabled: true });
    expect(r.sent.find((m) => m.params.some((p) => p.includes(o.receiptToken)))?.lang).toBe('en');
  });

  it('without WhatsApp set up nothing is sent, but the order still counts as delivered', async () => {
    const o = await paidOrder();
    const r = recorder();
    await deliverAll({ send: r.send, warm: r.warm, enabled: false });
    expect(r.sent).toHaveLength(0);
    const [order] = await db().select().from(orders).where(eq(orders.id, o.orderId));
    expect(order!.deliveredAt).not.toBeNull();
  });
});

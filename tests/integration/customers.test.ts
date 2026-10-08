import { beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/server/db/client';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { customerProfile, listCustomers } from '@/server/customers/admin';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

async function order(phone: string, name: string, pay: boolean) {
  const visitor = { ...ctx, ipHash: randomToken(8) };
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.basic.id, locale: 'ar', values: weddingValues() }, visitor);
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name, phone, email: `${randomToken(4)}@example.com` }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
  if (pay) await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  return o;
}

describe('Admin customers', () => {
  it('groups orders by phone number and shows everything about the customer', async () => {
    const phone = `0770${String(Date.now()).slice(-7)}`;
    await order(phone, 'سارة', true);
    await order(phone, 'سارة أحمد', false);

    const [c] = await listCustomers(db(), { q: phone.slice(1) });
    expect(c).toMatchObject({ name: 'سارة أحمد', orderCount: 2, paidIqd: 25000 });

    const profile = await customerProfile(db(), c!.id);
    expect(profile?.orders).toHaveLength(2);
    expect(profile?.names).toEqual(['سارة أحمد', 'سارة']);
    expect(profile?.orders.every((o) => /^\d{3} \d{3} \d{4}$/.test(o.accessCode) && o.receiptPath.startsWith('/r/'))).toBe(true);
  });

  it('finds customers by name and returns nothing for an unknown id', async () => {
    expect((await listCustomers(db(), { q: 'سارة أحمد' })).length).toBeGreaterThan(0);
    expect(await customerProfile(db(), '00000000-0000-4000-8000-000000000000')).toBeNull();
  });
});

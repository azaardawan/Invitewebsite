import { beforeAll, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, invitations, packages } from '@/server/db/schema';
import { createDraft, findByPreviewToken } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { isLive, markOrderPaid } from '@/server/orders/payment';
import { getReceipt } from '@/server/orders/receipt';
import { updatePackage } from '@/server/catalog/packages';
import { extendInvitation } from '@/server/invitation/admin';
import { FOREVER, isForever, type PackageLifetime } from '@/catalog/lifetime';
import { randomToken } from '@/lib/crypto';
import { activeTheme, BASIC_FIELDS, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

const customer = { name: 'حسين علي', phone: '0770 123 4567', email: 'buyer@example.com' };
const visitor = () => ({ ...ctx, ipHash: randomToken(8) });
const basic = (lifetime?: PackageLifetime) => ({
  name: { ar: 'عادي', en: 'Normal' },
  priceIqd: 25000,
  fieldKeys: [...BASIC_FIELDS],
  featureKeys: ['music', 'print_card'] as ('music' | 'print_card')[],
  ...(lifetime ? { lifetime } : {}),
});

async function paidInvitation(now: Date) {
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.basic.id, locale: 'ar', values: weddingValues() }, visitor());
  const o = await createOrder(db(), { previewToken: d.previewToken, customer, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor());
  await markOrderPaid(db(), o.orderId, { kind: 'WAYL' }, now);
  const receipt = await getReceipt(db(), o.receiptToken, now);
  const [inv] = await db().select().from(invitations).where(eq(invitations.publicId, receipt!.snapshot.invitation.publicId));
  return { inv: inv!, receipt: receipt! };
}

describe('package online time (30 days, 60 days, 1 year, forever)', () => {
  it('publishes for the package’s time and records it in the order', async () => {
    const now = new Date('2026-10-16T09:00:00Z');
    const cases: [PackageLifetime, string][] = [
      ['30', '2026-11-15T09:00:00.000Z'],
      ['60', '2026-12-15T09:00:00.000Z'],
      ['365', '2027-10-16T09:00:00.000Z'],
      ['forever', FOREVER.toISOString()],
    ];
    for (const [lifetime, expires] of cases) {
      await updatePackage(db(), shop.basic.id, basic(lifetime), shop.actor);
      const { inv, receipt } = await paidInvitation(now);
      expect(inv.lifetime).toBe(lifetime);
      expect(inv.expiresAt?.toISOString()).toBe(expires);
      expect((receipt.snapshot.package as { lifetime?: string }).lifetime).toBe(lifetime);
    }
  });

  it('a forever invitation stays live and cannot be extended', async () => {
    await updatePackage(db(), shop.basic.id, basic('forever'), shop.actor);
    const { inv } = await paidInvitation(new Date());
    expect(isForever(inv.expiresAt)).toBe(true);
    expect(isLive(inv, new Date('2120-01-01T00:00:00Z'))).toBe(true);
    await expect(extendInvitation(db(), inv.id, { amount: 7, unit: 'days', reason: 'customer asked for more' }, shop.actor)).rejects.toMatchObject({ code: 'forever' });
  });

  it('the time is the package’s at checkout; a paid order keeps its own', async () => {
    await updatePackage(db(), shop.basic.id, basic('30'), shop.actor);
    const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.basic.id, locale: 'ar', values: weddingValues() }, visitor());
    expect((await findByPreviewToken(db(), d.previewToken))?.lifetime).toBe('30');
    // The owner changes the package before the customer pays: checkout takes the new time.
    await updatePackage(db(), shop.basic.id, basic('365'), shop.actor);
    const o = await createOrder(db(), { previewToken: d.previewToken, customer, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor());
    const now = new Date('2026-10-16T09:00:00Z');
    await markOrderPaid(db(), o.orderId, { kind: 'WAYL' }, now);
    // …and changing it again later never moves a paid invitation's end.
    await updatePackage(db(), shop.basic.id, basic('30'), shop.actor);
    const receipt = await getReceipt(db(), o.receiptToken, now);
    expect(receipt?.invitation.expiresAt?.toISOString()).toBe('2027-10-16T09:00:00.000Z');
  });

  it('leaving the time out keeps it; changes are audited', async () => {
    await updatePackage(db(), shop.basic.id, basic('60'), shop.actor);
    await updatePackage(db(), shop.basic.id, basic(), shop.actor);
    const [row] = await db().select().from(packages).where(eq(packages.id, shop.basic.id));
    expect(row?.lifetime).toBe('60');
    const logs = await db()
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.objectType, 'package'), eq(auditLogs.objectId, shop.basic.id)));
    expect(logs.some((l) => (l.after as { lifetime?: string } | null)?.lifetime === '60')).toBe(true);
  });

  it('rejects anything but the four choices', async () => {
    await expect(updatePackage(db(), shop.basic.id, { ...basic(), lifetime: '90' as PackageLifetime }, shop.actor)).rejects.toThrow();
  });
});

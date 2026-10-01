import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { generatedDocuments, guestResponses, invitations, rateLimitBuckets } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { submitGuestResponse } from '@/server/guests/responses';
import { ensureDocument } from '@/server/documents/documents';
import { runHousekeeping } from '@/server/housekeeping';
import { storage } from '@/server/storage';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

async function publishedWithKeepsake() {
  const visitor = { ...ctx, ipHash: randomToken(8) };
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues() }, visitor);
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
  await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
  await db()
    .update(invitations)
    .set({ featureKeys: [...inv!.featureKeys, 'congratulations', 'keepsake_pdf'] })
    .where(eq(invitations.id, inv!.id));
  await submitGuestResponse(db(), { invitationId: inv!.id, response: { name: 'سارة', attendance: 'ATTENDING', message: 'مبروك' }, ipHash: randomToken(8), clientToken: randomToken(24) });
  await ensureDocument(db(), inv!.id, 'keepsake', { render: async () => Buffer.from('%PDF-1.7 fake') });
  return inv!;
}

describe('housekeeping', () => {
  it('deletes guest replies and the keepsake 12 months after the invitation ended, and nothing sooner', async () => {
    const recent = await publishedWithKeepsake();
    const old = await publishedWithKeepsake();
    await db().update(invitations).set({ expiresAt: new Date(Date.now() - 400 * 86_400_000) }).where(eq(invitations.id, old.id));
    const [oldDoc] = await db().select().from(generatedDocuments).where(eq(generatedDocuments.invitationId, old.id));
    await db().insert(rateLimitBuckets).values({ key: `test:${randomToken(6)}`, windowStart: new Date(Date.now() - 3 * 86_400_000), count: 1 });

    const result = await runHousekeeping(db(), new Date(), { prepareKeepsakes: false });
    expect(result.repliesDeleted).toBeGreaterThanOrEqual(1);
    expect(result.keepsakesDeleted).toBeGreaterThanOrEqual(1);

    expect(await db().select().from(guestResponses).where(eq(guestResponses.invitationId, old.id))).toEqual([]);
    expect(await db().select().from(generatedDocuments).where(eq(generatedDocuments.invitationId, old.id))).toEqual([]);
    expect(await storage().get(oldDoc!.storageKey)).toBeNull();
    // The recent invitation keeps everything.
    expect(await db().select().from(guestResponses).where(eq(guestResponses.invitationId, recent.id))).toHaveLength(1);
    expect(await db().select().from(generatedDocuments).where(eq(generatedDocuments.invitationId, recent.id))).toHaveLength(1);

    // Safe to run again.
    expect(await runHousekeeping(db(), new Date(), { prepareKeepsakes: false })).toMatchObject({ repliesDeleted: 0, keepsakesDeleted: 0 });
  });
});

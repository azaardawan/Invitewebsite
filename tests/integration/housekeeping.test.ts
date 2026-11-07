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

  it('deletes the collages, posters and other pictures made from the customer photos with them', async () => {
    const old = await publishedWithKeepsake();
    await db().update(invitations).set({ expiresAt: new Date(Date.now() - 400 * 86_400_000) }).where(eq(invitations.id, old.id));
    const kinds = ['COLLAGE_WALL_JPG', 'COLLAGE_WALL_PREVIEW', 'POSTER_PORTRAIT_JPG', 'POSTER_LANDSCAPE_PREVIEW', 'OG_IMAGE', 'PRINT_CARD'] as const;
    const keys: string[] = [];
    for (const kind of kinds) {
      const key = `documents/${crypto.randomUUID()}.png`;
      await storage().put(key, Buffer.from('x'), 'image/png');
      await db().insert(generatedDocuments).values({ invitationId: old.id, kind, storageKey: key, sourceHash: 'h', byteSize: 1, themeVersionId: old.themeVersionId });
      keys.push(key);
    }
    const result = await runHousekeeping(db(), new Date(), { prepareKeepsakes: false });
    expect(result.documentsDeleted).toBeGreaterThanOrEqual(kinds.length + 1);
    expect(await db().select().from(generatedDocuments).where(eq(generatedDocuments.invitationId, old.id))).toEqual([]);
    for (const key of keys) expect(await storage().get(key)).toBeNull();
  });

  it('deletes every watermarked preview of an order left unpaid for a week, collages and posters included', async () => {
    const visitor = { ...ctx, ipHash: randomToken(8) };
    const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues() }, visitor);
    const [draft] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
    for (const kind of ['COLLAGE_STORY_PREVIEW', 'POSTER_PORTRAIT_PREVIEW', 'STORY_PREVIEW'] as const) {
      const key = `documents/${crypto.randomUUID()}.png`;
      await storage().put(key, Buffer.from('x'), 'image/png');
      await db().insert(generatedDocuments).values({ invitationId: d.invitationId, kind, storageKey: key, sourceHash: 'h', byteSize: 1, themeVersionId: draft!.themeVersionId });
    }
    await db().update(invitations).set({ updatedAt: new Date(Date.now() - 8 * 86_400_000) }).where(eq(invitations.id, d.invitationId));
    await runHousekeeping(db(), new Date(), { prepareKeepsakes: false });
    expect(await db().select().from(generatedDocuments).where(eq(generatedDocuments.invitationId, d.invitationId))).toEqual([]);
  });

  it('prepares the keepsake of an invitation that ended in the last 7 days', async () => {
    const ended = await publishedWithKeepsake();
    await db().update(invitations).set({ expiresAt: new Date(Date.now() - 2 * 86_400_000) }).where(eq(invitations.id, ended.id));

    // The keepsake already exists, so nothing is rendered; the run must still find the invitation.
    const result = await runHousekeeping(db(), new Date());
    expect(result.keepsakesPrepared).toBeGreaterThanOrEqual(1);
  });
});

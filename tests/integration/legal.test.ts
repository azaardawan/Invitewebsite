import { beforeAll, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { legalPolicyVersions, orders } from '@/server/db/schema';
import { acceptedVersions, currentPolicy, discardDraft, policyAdminView, publishDraft, saveDraft } from '@/server/legal/policies';
import { seedLegalDrafts } from '@/server/legal/seed';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { getSettings, updateContactSettings } from '@/server/settings/service';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx, makeAdmin } from '../helpers';

let actor: { adminId: string; ipHash: null };
beforeAll(async () => {
  actor = { adminId: (await makeAdmin()).id, ipHash: null };
  // Start from a clean slate for the policy tables (published rows are protected, so drop via TRUNCATE-free path).
  await db().execute(sql`ALTER TABLE legal_policy_versions DISABLE TRIGGER legal_policy_versions_frozen`);
  await db().delete(legalPolicyVersions);
  await db().execute(sql`ALTER TABLE legal_policy_versions ENABLE TRIGGER legal_policy_versions_frozen`);
});

describe('legal policies', () => {
  it('seeds drafts once, never publishing or overwriting them', async () => {
    await seedLegalDrafts(db());
    await seedLegalDrafts(db());
    const terms = await policyAdminView(db(), 'TERMS');
    expect(terms.draft?.version).toBe(1);
    expect(terms.published).toEqual([]);
    expect(await currentPolicy(db(), 'TERMS')).toBeNull();
    expect(await acceptedVersions(db())).toEqual({ terms: 'none', refund: 'none', privacy: 'none' });
  });

  it('edits a draft, publishes it, and freezes the published version', async () => {
    await saveDraft(db(), 'TERMS', { ar: 'نص الشروط', en: 'Terms text' }, actor);
    // Not without the Kurdish texts.
    await expect(publishDraft(db(), 'TERMS', actor)).rejects.toMatchObject({ code: 'allLanguages' });
    await saveDraft(db(), 'TERMS', { ar: 'نص الشروط', en: 'Terms text', ckb: 'دەقی مەرجەکان', bdn: 'نڤیسینا مەرجان' }, actor);
    expect(await publishDraft(db(), 'TERMS', actor)).toBe(1);
    const live = await currentPolicy(db(), 'TERMS');
    expect(live?.content.en).toBe('Terms text');

    // The next edit starts version 2 and doesn't touch the live one.
    await saveDraft(db(), 'TERMS', { ar: 'نص جديد', en: 'New text' }, actor);
    expect((await policyAdminView(db(), 'TERMS')).draft?.version).toBe(2);
    expect((await currentPolicy(db(), 'TERMS'))?.content.en).toBe('Terms text');

    // The database itself refuses to change or delete a published version.
    await expect(db().update(legalPolicyVersions).set({ content: { ar: 'x', en: 'x' } }).where(eq(legalPolicyVersions.id, live!.id))).rejects.toThrow();
    await expect(db().delete(legalPolicyVersions).where(eq(legalPolicyVersions.id, live!.id))).rejects.toThrow();

    await discardDraft(db(), 'TERMS', actor);
    expect((await policyAdminView(db(), 'TERMS')).draft).toBeNull();
    await expect(publishDraft(db(), 'TERMS', actor)).rejects.toMatchObject({ code: 'noDraft' });
    await expect(saveDraft(db(), 'TERMS', { ar: '', en: 'x' }, actor)).rejects.toMatchObject({ code: 'invalid' });
  });

  it('records the published versions a customer accepted on their order', async () => {
    await publishDraft(db(), 'REFUND', actor); // the seeded refund draft
    const shop = await activeTheme();
    const visitor = { ...ctx, ipHash: randomToken(8) };
    const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.basic.id, locale: 'ar', values: weddingValues() }, visitor);
    const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
    const [row] = await db().select().from(orders).where(eq(orders.id, o.orderId));
    expect(row!.legalAcceptance).toMatchObject({ terms: 'v1', refund: 'v1', privacy: 'none' });
  });
});

describe('contact settings', () => {
  it('stores public contact details and rejects bad ones', async () => {
    await updateContactSettings(
      db(),
      { phone: '+9647701234567', email: 'hello@bahjaaa.com', instagram: 'bahja.iq', facebook: null, tiktok: 'bahja', address: { ar: 'بغداد', en: 'Baghdad' }, hours: null },
      actor,
    );
    expect((await getSettings(db())).contact).toMatchObject({ email: 'hello@bahjaaa.com', instagram: 'bahja.iq', tiktok: 'bahja' });
    await expect(
      updateContactSettings(db(), { phone: null, email: 'not-an-email', instagram: null, facebook: null, tiktok: null, address: null, hours: null }, actor),
    ).rejects.toThrow();
    await expect(
      updateContactSettings(db(), { phone: null, email: null, instagram: 'https://evil.example/x', facebook: null, tiktok: null, address: null, hours: null }, actor),
    ).rejects.toThrow();
  });
});

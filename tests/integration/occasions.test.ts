import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, invitations, sections, themes } from '@/server/db/schema';
import { themeExtraSectionIds, updateThemeSettings } from '@/server/catalog/themes';
import { themeOccasions } from '@/server/catalog/occasions';
import { createDraft } from '@/server/orders/drafts';
import { invitationRenderData } from '@/server/invitation/load';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
let weddingId: string;
let engagementId: string;
beforeAll(async () => {
  shop = await activeTheme();
  weddingId = (await db().select().from(sections).where(eq(sections.key, 'wedding')))[0]!.id;
  engagementId = (await db().select().from(sections).where(eq(sections.key, 'engagement')))[0]!.id;
});

const settings = (extra?: string[]) => ({ name: shop.theme.name, sectionId: weddingId, coverAssetId: shop.theme.coverAssetId, musicTrackId: shop.song.id, extraSectionIds: extra });
const draft = (occasion?: string) =>
  createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues(), occasion }, { ...ctx, ipHash: randomToken(8) });

describe('a design sold in several occasions', () => {
  it('keeps its other occasions (never the main one), audited, and leaves them alone when the form omits them', async () => {
    const [t] = await db().select().from(themes).where(eq(themes.id, shop.theme.id));
    await updateThemeSettings(db(), shop.theme.id, { ...settings([engagementId, weddingId]), coverAssetId: t!.coverAssetId }, shop.actor);
    expect(await themeExtraSectionIds(db(), shop.theme.id)).toEqual([engagementId]);
    expect(await themeOccasions(db(), shop.theme.id, weddingId)).toEqual(['wedding', 'engagement']);
    await updateThemeSettings(db(), shop.theme.id, { ...settings(undefined), coverAssetId: t!.coverAssetId }, shop.actor);
    expect(await themeExtraSectionIds(db(), shop.theme.id)).toEqual([engagementId]);
    const log = (await db().select().from(auditLogs).where(eq(auditLogs.objectId, shop.theme.id))).filter((l) => l.action === 'theme.settings_updated').at(-2);
    expect(log?.after).toMatchObject({ extraSectionIds: [engagementId] });
  });

  it('asks the customer which occasion, records it, and tells the design', async () => {
    await expect(draft()).rejects.toMatchObject({ code: 'invalidFields', fieldErrors: { occasion: 'required' } });
    await expect(draft('birthday')).rejects.toMatchObject({ fieldErrors: { occasion: 'required' } });
    const { invitationId } = await draft('engagement');
    const [inv] = await db().select().from(invitations).where(eq(invitations.id, invitationId));
    expect(inv!.sectionId).toBe(engagementId);
    expect((await invitationRenderData(db(), inv!, 'live')).props.occasion).toBe('engagement');
  });

  it('needs no choice once it is back to one occasion', async () => {
    const [t] = await db().select().from(themes).where(eq(themes.id, shop.theme.id));
    await updateThemeSettings(db(), shop.theme.id, { ...settings([]), coverAssetId: t!.coverAssetId }, shop.actor);
    const { invitationId } = await draft();
    const [inv] = await db().select().from(invitations).where(eq(invitations.id, invitationId));
    expect(inv!.sectionId).toBe(weddingId);
    expect((await invitationRenderData(db(), inv!, 'live')).props.occasion).toBe('wedding');
  });
});

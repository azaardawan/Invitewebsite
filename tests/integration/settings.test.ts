import { beforeAll, describe, expect, it } from 'vitest';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, themes } from '@/server/db/schema';
import { getSettings, updateCurrencySettings, updateFeaturedThemes } from '@/server/settings/service';
import { activeTheme } from '../fixtures';
import { makeAdmin } from '../helpers';

let actor: { adminId: string; ipHash: null };
beforeAll(async () => {
  actor = { adminId: (await makeAdmin()).id, ipHash: null };
});

describe('exchange rate setting', () => {
  it('defaults to no rate (USD option hidden), then stores and audits changes', async () => {
    await updateCurrencySettings(db(), { usdRateIqd: null }, actor);
    expect((await getSettings(db())).currency.usdRateIqd).toBeNull();
    await updateCurrencySettings(db(), { usdRateIqd: 1310 }, actor);
    await updateCurrencySettings(db(), { usdRateIqd: 1320 }, actor);
    expect((await getSettings(db())).currency.usdRateIqd).toBe(1320);
    const logs = await db()
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.action, 'settings.currency_updated'), eq(auditLogs.actorAdminId, actor.adminId)))
      .orderBy(asc(auditLogs.id));
    expect(logs.at(-1)).toMatchObject({ before: { usdRateIqd: 1310 }, after: { usdRateIqd: 1320 }, actorAdminId: actor.adminId });
  });

  it('rejects nonsense rates', async () => {
    for (const bad of [0, -5, 12.5, 5, 10_000_000]) {
      await expect(updateCurrencySettings(db(), { usdRateIqd: bad }, actor)).rejects.toThrow();
    }
  });
});

describe('top 3 designs', () => {
  it('stores up to three designs on sale, best first, audited; refuses repeats and designs not on sale', async () => {
    const a = await activeTheme();
    const b = await activeTheme();
    await updateFeaturedThemes(db(), { themeIds: [b.theme.id, a.theme.id] }, actor);
    expect((await getSettings(db())).featured.themeIds).toEqual([b.theme.id, a.theme.id]);
    await expect(updateFeaturedThemes(db(), { themeIds: [a.theme.id, a.theme.id] }, actor)).rejects.toMatchObject({ code: 'duplicateFeatured' });
    await db().update(themes).set({ status: 'ARCHIVED' }).where(eq(themes.id, a.theme.id));
    await expect(updateFeaturedThemes(db(), { themeIds: [a.theme.id] }, actor)).rejects.toMatchObject({ code: 'featuredNotActive' });
    await expect(updateFeaturedThemes(db(), { themeIds: [a.theme.id, b.theme.id, a.theme.id, b.theme.id] }, actor)).rejects.toThrow();
    await updateFeaturedThemes(db(), { themeIds: [] }, actor);
    expect((await getSettings(db())).featured.themeIds).toEqual([]);
    const logs = await db().select().from(auditLogs).where(and(eq(auditLogs.action, 'settings.featured_updated'), eq(auditLogs.actorAdminId, actor.adminId)));
    expect(logs).toHaveLength(2);
  });
});

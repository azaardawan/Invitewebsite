import { beforeAll, describe, expect, it } from 'vitest';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs } from '@/server/db/schema';
import { getSettings, updateCurrencySettings } from '@/server/settings/service';
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

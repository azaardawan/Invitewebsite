import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { websiteSettings } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { auditActor, type Actor } from '@/server/catalog/common';
import { currencySettings, settingsData, type CurrencySettings, type SettingsData } from './schema';

/** Current settings with defaults for anything never set. */
export async function getSettings(db: DbOrTx): Promise<SettingsData> {
  const [row] = await db.select().from(websiteSettings).where(eq(websiteSettings.id, 1));
  const parsed = settingsData.safeParse(row?.data ?? {});
  return parsed.success ? parsed.data : settingsData.parse({});
}

export async function updateCurrencySettings(db: DbOrTx, input: CurrencySettings, actor: Actor) {
  const next = currencySettings.parse(input);
  return db.transaction(async (tx) => {
    await tx.insert(websiteSettings).values({ id: 1 }).onConflictDoNothing();
    const [row] = await tx.select().from(websiteSettings).where(eq(websiteSettings.id, 1)).for('update');
    const before = settingsData.parse(row?.data ?? {});
    const data: SettingsData = { ...before, currency: next };
    await tx.update(websiteSettings).set({ data, updatedAt: new Date(), updatedBy: actor.adminId }).where(eq(websiteSettings.id, 1));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'settings.currency_updated',
      objectType: 'website_settings',
      objectId: '1',
      before: before.currency,
      after: next,
    });
    return data;
  });
}

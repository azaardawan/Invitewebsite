import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { themes, websiteSettings } from '@/server/db/schema';
import { CatalogError } from '@/server/catalog/common';
import { recordAudit } from '@/server/audit/audit';
import { auditActor, type Actor } from '@/server/catalog/common';
import {
  contactSettings,
  featuredSettings,
  currencySettings,
  paymentSettings,
  settingsData,
  type ContactSettings,
  type FeaturedSettings,
  type CurrencySettings,
  type PaymentSettings,
  type SettingsData,
} from './schema';

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

export async function updatePaymentSettings(db: DbOrTx, input: PaymentSettings, actor: Actor) {
  const next = paymentSettings.parse(input);
  return db.transaction(async (tx) => {
    await tx.insert(websiteSettings).values({ id: 1 }).onConflictDoNothing();
    const [row] = await tx.select().from(websiteSettings).where(eq(websiteSettings.id, 1)).for('update');
    const before = settingsData.parse(row?.data ?? {});
    const data: SettingsData = { ...before, payment: next };
    await tx.update(websiteSettings).set({ data, updatedAt: new Date(), updatedBy: actor.adminId }).where(eq(websiteSettings.id, 1));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'settings.payment_updated',
      objectType: 'website_settings',
      objectId: '1',
      before: before.payment,
      after: next,
    });
    return data;
  });
}

export async function updateContactSettings(db: DbOrTx, input: ContactSettings, actor: Actor) {
  const next = contactSettings.parse(input);
  return db.transaction(async (tx) => {
    await tx.insert(websiteSettings).values({ id: 1 }).onConflictDoNothing();
    const [row] = await tx.select().from(websiteSettings).where(eq(websiteSettings.id, 1)).for('update');
    const before = settingsData.parse(row?.data ?? {});
    const data: SettingsData = { ...before, contact: next };
    await tx.update(websiteSettings).set({ data, updatedAt: new Date(), updatedBy: actor.adminId }).where(eq(websiteSettings.id, 1));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'settings.contact_updated',
      objectType: 'website_settings',
      objectId: '1',
      before: before.contact,
      after: next,
    });
    return data;
  });
}


/**
 * Sets the owner's top 3 themes (best first; fewer is fine, empty clears them). Each must be on sale and listed
 * once. Audited.
 */
export async function updateFeaturedThemes(db: DbOrTx, input: FeaturedSettings, actor: Actor) {
  const next = featuredSettings.parse(input);
  if (new Set(next.themeIds).size !== next.themeIds.length) throw new CatalogError('duplicateFeatured');
  return db.transaction(async (tx) => {
    if (next.themeIds.length) {
      const live = await tx.select({ id: themes.id }).from(themes).where(and(inArray(themes.id, next.themeIds), eq(themes.status, 'ACTIVE')));
      if (live.length !== next.themeIds.length) throw new CatalogError('featuredNotActive');
    }
    await tx.insert(websiteSettings).values({ id: 1 }).onConflictDoNothing();
    const [row] = await tx.select().from(websiteSettings).where(eq(websiteSettings.id, 1)).for('update');
    const before = settingsData.parse(row?.data ?? {});
    const data: SettingsData = { ...before, featured: next };
    await tx.update(websiteSettings).set({ data, updatedAt: new Date(), updatedBy: actor.adminId }).where(eq(websiteSettings.id, 1));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'settings.featured_updated',
      objectType: 'website_settings',
      objectId: '1',
      before: before.featured,
      after: next,
    });
    return data;
  });
}

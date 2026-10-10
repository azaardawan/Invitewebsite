import 'server-only';
import { cache } from 'react';
import { db } from '@/server/db/client';
import { getSettings } from './service';
import { settingsData, type SettingsData } from './schema';
import type { ContactInfo } from '@/lib/contact-links';
import { currentPolicy } from '@/server/legal/policies';

/**
 * Settings for public pages (footer, contact page, WhatsApp buttons). Never
 * throws: if the database is unreachable the site still renders, without them.
 */
export const publicSettings = cache(async (): Promise<SettingsData> => {
  try {
    return await getSettings(db());
  } catch {
    return settingsData.parse({});
  }
});

/** Contact details for the footer, contact page and WhatsApp buttons. */
export async function publicContact(): Promise<ContactInfo> {
  const { payment, contact } = await publicSettings();
  return { whatsapp: payment.whatsapp, ...contact };
}

/** Whether the newborn terms are published (the footer links them then). Never throws. */
export async function newbornTermsPublished(): Promise<boolean> {
  try {
    return !!(await currentPolicy(db(), 'TERMS_NEWBORN'));
  } catch {
    return false;
  }
}

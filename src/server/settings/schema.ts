import { z } from 'zod';

/**
 * Exchange rate used only to *display* approximate USD prices.
 * All payments are charged in IQD (owner decision N). Null hides the USD option.
 */
export const currencySettings = z.object({
  usdRateIqd: z.number().int().min(100).max(100_000).nullable(),
});

const i18nText = z.object({ ar: z.string(), en: z.string(), ckb: z.string().nullish(), bdn: z.string().nullish() });

/**
 * How customers pay while online payment (WAYL) isn't switched on: the
 * business WhatsApp number and owner-written payment instructions shown on the
 * private receipt.
 */
export const paymentSettings = z.object({
  /** E.164, e.g. +9647701234567. */
  whatsapp: z.string().regex(/^\+\d{8,15}$/).nullable(),
  manualInstructions: i18nText.nullable(),
});

const handle = z
  .string()
  .regex(/^[A-Za-z0-9._]{1,60}$/)
  .nullable();

/**
 * Public contact details shown in the footer and on the contact page. The
 * WhatsApp number is shared with payment settings (one business number).
 */
export const contactSettings = z.object({
  /** E.164 phone for calls, e.g. +9647701234567. */
  phone: z.string().regex(/^\+\d{8,15}$/).nullable(),
  email: z.email().max(254).nullable(),
  /** Usernames only (no @, no URL). */
  instagram: handle,
  facebook: handle,
  tiktok: handle,
  address: i18nText.nullable(),
  hours: i18nText.nullable(),
});

/**
 * The owner's top 3 themes, best first: shown together on the homepage, the first marked "Best seller" and the
 * other two "Top pick" wherever themes are listed.
 */
export const featuredSettings = z.object({
  themeIds: z.array(z.uuid()).max(3),
});

export const settingsData = z.object({
  currency: currencySettings.default({ usdRateIqd: null }),
  payment: paymentSettings.default({ whatsapp: null, manualInstructions: null }),
  contact: contactSettings.default({ phone: null, email: null, instagram: null, facebook: null, tiktok: null, address: null, hours: null }),
  featured: featuredSettings.default({ themeIds: [] }),
});

export type SettingsData = z.infer<typeof settingsData>;
export type CurrencySettings = z.infer<typeof currencySettings>;
export type PaymentSettings = z.infer<typeof paymentSettings>;
export type ContactSettings = z.infer<typeof contactSettings>;
export type FeaturedSettings = z.infer<typeof featuredSettings>;

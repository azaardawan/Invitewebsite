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

export const settingsData = z.object({
  currency: currencySettings.default({ usdRateIqd: null }),
  payment: paymentSettings.default({ whatsapp: null, manualInstructions: null }),
});

export type SettingsData = z.infer<typeof settingsData>;
export type CurrencySettings = z.infer<typeof currencySettings>;
export type PaymentSettings = z.infer<typeof paymentSettings>;

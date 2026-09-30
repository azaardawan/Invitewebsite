import { z } from 'zod';

/**
 * Exchange rate used only to *display* approximate USD prices.
 * All payments are charged in IQD (owner decision N). Null hides the USD option.
 */
export const currencySettings = z.object({
  usdRateIqd: z.number().int().min(100).max(100_000).nullable(),
});

export const settingsData = z.object({
  currency: currencySettings.default({ usdRateIqd: null }),
});

export type SettingsData = z.infer<typeof settingsData>;
export type CurrencySettings = z.infer<typeof currencySettings>;

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

/**
 * Guest photo sharing (src/catalog/guest-photos.ts): offered at the end of the order form when `enabled`. The basic
 * price covers 750 photos; each 50 more cost `stepPriceIqd`, up to `maxCap` in total.
 */
export const guestPhotoSettings = z.object({
  enabled: z.boolean(),
  basePriceIqd: z.number().int().min(0).max(100_000_000),
  stepPriceIqd: z.number().int().min(0).max(100_000_000),
  maxCap: z.number().int().min(750).max(20_000),
});

/**
 * The signature board (src/catalog/signature-board.ts): offered at the end of the order form when `enabled`, on
 * designs with board artwork; `perBoard` people on each board, the next ones on another board.
 */
export const signatureBoardSettings = z.object({
  enabled: z.boolean(),
  priceIqd: z.number().int().min(0).max(100_000_000),
  perBoard: z.number().int().min(6).max(120),
});

export const settingsData = z.object({
  currency: currencySettings.default({ usdRateIqd: null }),
  payment: paymentSettings.default({ whatsapp: null, manualInstructions: null }),
  contact: contactSettings.default({ phone: null, email: null, instagram: null, facebook: null, tiktok: null, address: null, hours: null }),
  featured: featuredSettings.default({ themeIds: [] }),
  guestPhotos: guestPhotoSettings.default({ enabled: true, basePriceIqd: 15_000, stepPriceIqd: 5_000, maxCap: 3_000 }),
  signatureBoard: signatureBoardSettings.default({ enabled: true, priceIqd: 25_000, perBoard: 30 }),
});

export type SettingsData = z.infer<typeof settingsData>;
export type CurrencySettings = z.infer<typeof currencySettings>;
export type PaymentSettings = z.infer<typeof paymentSettings>;
export type ContactSettings = z.infer<typeof contactSettings>;
export type FeaturedSettings = z.infer<typeof featuredSettings>;
export type GuestPhotoSettings = z.infer<typeof guestPhotoSettings>;
export type SignatureBoardSettings = z.infer<typeof signatureBoardSettings>;

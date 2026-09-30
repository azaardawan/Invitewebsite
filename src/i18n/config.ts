/**
 * Website languages. Arabic is the default and is served without a URL prefix
 * (`/`), the others under `/en`, `/ckb` (Sorani) and `/bdn` (Badini).
 *
 * Invitation language is independent of website language and is stored on
 * each invitation.
 */
export const locales = ['ar', 'en', 'ckb', 'bdn'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ar';

export const localeMeta: Record<
  Locale,
  {
    dir: 'rtl' | 'ltr';
    /** BCP-47 tag for the `lang` attribute (`bdn` is our internal code for Badini). */
    htmlLang: string;
    /** Locale used for Intl date/number formatting. */
    intlLocale: string;
    /** Language name in its own language (autonym), shown in the language switcher. */
    autonym: string;
  }
> = {
  ar: { dir: 'rtl', htmlLang: 'ar-IQ', intlLocale: 'ar-IQ', autonym: 'العربية' },
  en: { dir: 'ltr', htmlLang: 'en', intlLocale: 'en-GB', autonym: 'English' },
  // Kurdish autonyms approved by the owner (docs/translations/KURDISH_REVIEW.md, batch 1).
  ckb: { dir: 'rtl', htmlLang: 'ckb-IQ', intlLocale: 'ckb-IQ', autonym: 'کوردی - سۆرانی' },
  bdn: { dir: 'rtl', htmlLang: 'kmr-Arab-IQ', intlLocale: 'ar-IQ', autonym: 'کوردی - بادینی' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** The admin panel is Arabic/English only (see docs/translations/README.md). */
export const adminLocales = ['ar', 'en'] as const;
export type AdminLocale = (typeof adminLocales)[number];
export const ADMIN_LOCALE_COOKIE = 'bahja_admin_locale';
export function isAdminLocale(value: unknown): value is AdminLocale {
  return value === 'ar' || value === 'en';
}

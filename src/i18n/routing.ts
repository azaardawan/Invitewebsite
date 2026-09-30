import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  // Arabic is the default for everyone; visitors switch language explicitly.
  // (Many Iraqi phones are set to English, and auto-redirecting would bypass the primary language.)
  localeDetection: false,
});

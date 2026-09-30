import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { ADMIN_LOCALE_COOKIE, isAdminLocale, isLocale, localeMeta, type Locale } from './config';
import { messagesFor } from './messages';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  let locale: Locale;
  if (isLocale(requested)) {
    locale = requested;
  } else {
    // Routes outside `[locale]` (the admin panel) use the admin's language preference.
    const adminLocale = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
    locale = isAdminLocale(adminLocale) ? adminLocale : routing.defaultLocale;
  }
  return {
    locale,
    messages: messagesFor(locale),
    timeZone: 'Asia/Baghdad',
    formats: {
      dateTime: {
        short: { day: 'numeric', month: 'short', year: 'numeric' },
        long: { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' },
      },
    },
    onError(error) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[i18n:${localeMeta[locale].htmlLang}]`, error.message);
    },
  };
});

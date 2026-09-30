import '@fontsource-variable/noto-sans-arabic';
import '../globals.css';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localeMeta } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { SiteHeader } from '@/components/storefront/SiteHeader';
import { SiteFooter } from '@/components/storefront/SiteFooter';

// Only the four known locales exist; anything else (e.g. `/favicon.ico`) is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    title: { default: t('brand'), template: `%s · ${t('brand')}` },
    metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'common' });
  const meta = localeMeta[locale];

  return (
    <html lang={meta.htmlLang} dir={meta.dir}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-4 focus:py-2"
        >
          {t('skipToContent')}
        </a>
        <NextIntlClientProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

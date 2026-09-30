import '@fontsource-variable/noto-sans-arabic';
import '../globals.css';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { isAdminLocale } from '@/i18n/config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin');
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function AdminRootLayout({ children }: LayoutProps<'/admin'>) {
  const locale = await getLocale();
  const adminLocale = isAdminLocale(locale) ? locale : 'ar';
  return (
    <html lang={adminLocale} dir={adminLocale === 'ar' ? 'rtl' : 'ltr'}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

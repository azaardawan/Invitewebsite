import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, localeMeta } from '@/i18n/config';

export const metadata: Metadata = { robots: { index: false, follow: true } };

/** Root layout for public theme samples: no platform CSS, the theme renders as guests will see it. */
export default async function SampleRootLayout({ children, params }: LayoutProps<'/t/[lang]'>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={localeMeta[lang].htmlLang} dir={localeMeta[lang].dir}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, localeMeta } from '@/i18n/config';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Root layout for invitation rendering: no platform CSS, fonts or chrome, so
 * a theme looks exactly as guests will see it. (Invitation pages in M7 use the same approach.)
 */
export default async function InvitationRootLayout({ children, params }: LayoutProps<'/admin/preview/[lang]'>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={localeMeta[lang].htmlLang} dir={localeMeta[lang].dir}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

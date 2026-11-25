import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { localeMeta } from '@/i18n/config';
import { tourLocale } from '@/server/tours/locale';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#1a1613' };

/** Minimal root layout (no platform CSS): a café's tour is its own full-screen page. */
export default async function TourRootLayout({ children }: LayoutProps<'/tour/[slug]'>) {
  const meta = localeMeta[tourLocale((await headers()).get('accept-language'))];
  return (
    <html lang={meta.htmlLang} dir={meta.dir}>
      <body style={{ margin: 0, background: '#1a1613', overscrollBehavior: 'none' }}>{children}</body>
    </html>
  );
}

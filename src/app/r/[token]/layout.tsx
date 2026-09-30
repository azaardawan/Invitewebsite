import '@fontsource-variable/noto-sans-arabic';
import '../../globals.css';
import type { Metadata } from 'next';
import { isLocale, localeMeta } from '@/i18n/config';
import { receiptFor } from './data';

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default async function ReceiptRootLayout({ children, params }: LayoutProps<'/r/[token]'>) {
  const { token } = await params;
  const r = await receiptFor(token);
  const locale = r && isLocale(r.snapshot.invitation.locale) ? r.snapshot.invitation.locale : 'ar';
  return (
    <html lang={localeMeta[locale].htmlLang} dir={localeMeta[locale].dir}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

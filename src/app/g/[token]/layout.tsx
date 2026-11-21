import '@fontsource-variable/vazirmatn';
import '@fontsource/aref-ruqaa/400.css';
import '@fontsource/aref-ruqaa/700.css';
import '../../globals.css';
import type { Metadata } from 'next';
import { db } from '@/server/db/client';
import { isLocale, localeMeta } from '@/i18n/config';
import { invitationByUploadToken } from '@/server/guest-photos/service';

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' };

/** Guest photo upload page (from the photo QR code), in the invitation's language. */
export default async function GuestUploadLayout({ children, params }: LayoutProps<'/g/[token]'>) {
  const inv = await invitationByUploadToken(db(), (await params).token);
  const locale = inv && isLocale(inv.locale) ? inv.locale : 'ar';
  return (
    <html lang={localeMeta[locale].htmlLang} dir={localeMeta[locale].dir}>
      <body className="min-h-dvh bg-canvas antialiased">{children}</body>
    </html>
  );
}

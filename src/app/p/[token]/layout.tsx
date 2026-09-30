import type { Metadata } from 'next';
import { localeMeta } from '@/i18n/config';
import { previewInvitation } from './data';

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' };

/** Minimal root layout (no platform CSS) so the theme renders exactly as guests will see it. */
export default async function PreviewRootLayout({ children, params }: LayoutProps<'/p/[token]'>) {
  const { token } = await params;
  const inv = await previewInvitation(token);
  const meta = localeMeta[inv?.locale ?? 'ar'];
  return (
    <html lang={meta.htmlLang} dir={meta.dir}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

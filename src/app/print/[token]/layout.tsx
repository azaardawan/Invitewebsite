import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };

/** Bare document for Chromium's PDF export: no platform CSS, only the theme's print styles. */
export default function PrintRootLayout({ children }: LayoutProps<'/print/[token]'>) {
  return (
    <html>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

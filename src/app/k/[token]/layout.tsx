import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' };

/** Bare root layout for the file generator: no platform CSS, nothing but the kit page. */
export default function KitRenderRootLayout({ children }: LayoutProps<'/k/[token]'>) {
  return (
    <html lang="ar">
      <body style={{ margin: 0, background: 'transparent' }}>{children}</body>
    </html>
  );
}

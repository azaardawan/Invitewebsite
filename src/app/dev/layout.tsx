import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Theme lab', robots: { index: false, follow: false } };

/**
 * Development-only theme lab (design review, screenshots, print proofs).
 * No storefront CSS is loaded here, exactly like the future `/i/*` pages.
 */
export default function DevLayout({ children }: LayoutProps<'/dev'>) {
  return (
    <html lang="ar">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

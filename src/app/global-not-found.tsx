import '@fontsource-variable/vazirmatn';
import '@fontsource/aref-ruqaa/400.css';
import '@fontsource/aref-ruqaa/700.css';
import './globals.css';
import type { Metadata } from 'next';
import ar from '@/i18n/messages/ar.json';
import en from '@/i18n/messages/en.json';

export const metadata: Metadata = { title: `404 · ${ar.common.brand}`, robots: { index: false } };

/** Paths outside every route (e.g. an unknown /i/... link). Bilingual since the language is unknown. */
export default function GlobalNotFound() {
  return (
    <html lang="ar-IQ" dir="rtl">
      <body className="flex min-h-dvh items-center justify-center px-4 text-center antialiased">
        <main>
          <h1 className="text-2xl font-semibold">{ar.errors.notFoundTitle}</h1>
          <p className="mt-2 text-muted">{ar.errors.notFoundBody}</p>
          <p lang="en" dir="ltr" className="mt-6 text-muted">
            {en.errors.notFoundTitle} — {en.errors.notFoundBody}
          </p>
          {/* Plain link: this page renders outside the app's layouts and router. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="mt-8 inline-block rounded-full bg-accent px-6 py-3 text-accent-ink">
            {ar.errors.backHome}
          </a>
        </main>
      </body>
    </html>
  );
}

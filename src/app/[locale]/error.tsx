'use client';

import { useTranslations } from 'next-intl';

/** Customer-facing error boundary: no technical details are ever shown. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errors');
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">{t('genericTitle')}</h1>
      <button onClick={reset} className="mt-8 rounded-full bg-accent px-6 py-3 text-accent-ink">
        {t('tryAgain')}
      </button>
    </section>
  );
}

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Price } from '../currency';

export type ShowcasePackage = {
  id: string;
  name: string;
  description: string | null;
  priceIqd: number;
  features: string[];
  fieldsCount: number;
};

/**
 * The theme page's heart: the real theme running in a phone frame, and the
 * packages beside it. Choosing a package switches the preview to that
 * package's design state, so customers see exactly what they buy.
 */
export function ThemeShowcase({
  themeKey,
  lang,
  packages,
  defaultPackageId,
}: {
  themeKey: string;
  lang: string;
  packages: ShowcasePackage[];
  defaultPackageId?: string;
}) {
  const t = useTranslations('store');
  const [pkg, setPkg] = useState(defaultPackageId ?? packages[0]?.id);
  const [names, setNames] = useState<'short' | 'long'>('short');
  const src = `/t/${lang}/${themeKey}?${new URLSearchParams({ ...(pkg ? { pkg } : {}), names })}`;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-20">
      <div id="preview" className="flex scroll-mt-6 flex-col items-center gap-4 lg:sticky lg:top-6">
        <div className="relative w-full max-w-[380px] rounded-[44px] bg-heading p-3 shadow-[0_30px_60px_rgb(58_21_32/0.25)]">
          <span aria-hidden className="absolute top-5 left-1/2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-[#ffffff33]" />
          <iframe
            key={src}
            src={src}
            title={t('livePreview')}
            loading="lazy"
            className="block h-[640px] w-full rounded-[34px] bg-surface lg:h-[720px]"
          />
        </div>
        <p className="max-w-[380px] text-center text-sm text-muted">{t('previewHint')}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {(['short', 'long'] as const).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={names === n}
              onClick={() => setNames(n)}
              className="h-10 rounded-full border border-line px-4 text-sm transition aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-ink"
            >
              {n === 'short' ? t('shortNames') : t('longNames')}
            </button>
          ))}
          <a href={src} target="_blank" rel="noopener" className="h-10 px-3 text-sm leading-10 font-medium text-accent underline underline-offset-4">
            {t('openFull')}
          </a>
        </div>
      </div>

      <section aria-labelledby="packages-title" className="flex flex-col gap-5">
        <h2 id="packages-title" className="font-display text-[32px] font-bold text-heading lg:text-[44px]">
          {t('packagesTitle')}
        </h2>
        <ul className="flex flex-col gap-4">
          {packages.map((p) => {
            const selected = p.id === pkg;
            return (
              <li key={p.id}>
                <div
                  data-selected={selected}
                  className="flex flex-col gap-4 rounded-[26px] border border-line bg-surface p-5 transition data-[selected=true]:border-accent data-[selected=true]:shadow-[0_14px_30px_rgb(110_31_51/0.12)] lg:p-7"
                >
                  <button type="button" onClick={() => setPkg(p.id)} aria-pressed={selected} className="flex items-start justify-between gap-4 text-start">
                    <span className="flex flex-col gap-1">
                      <span className="text-xl font-semibold text-heading">{p.name}</span>
                      {p.description ? <span className="text-sm leading-relaxed text-muted">{p.description}</span> : null}
                    </span>
                    <span className="shrink-0 text-lg font-semibold text-accent">
                      <Price iqd={p.priceIqd} />
                    </span>
                  </button>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold tracking-wide text-gold uppercase">{t('includes')}</span>
                    <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6e1f33" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                            <path d="M5 12l5 5 9-10" />
                          </svg>
                          {f}
                        </li>
                      ))}
                      <li className="flex items-start gap-2 text-muted">{t('fieldsCount', { count: p.fieldsCount })}</li>
                    </ul>
                  </div>
                  <Link
                    href={`/themes/${themeKey}/order?pkg=${p.id}`}
                    className="inline-flex h-12 items-center justify-center self-start rounded-full bg-accent px-7 text-sm font-semibold text-accent-ink transition hover:bg-accent-deep"
                  >
                    {t('choose')}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

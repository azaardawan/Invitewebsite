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
  /** How long the invitation stays online ("Online for 30 days", "Online forever"). */
  onlineFor: string;
  features: string[];
  /** What the customer fills in ("The groom's name and the bride's name", "Date and time"…). */
  details: string[];
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
  occasion,
  filesOnly = false,
}: {
  themeKey: string;
  lang: string;
  packages: ShowcasePackage[];
  defaultPackageId?: string;
  /** The occasion the customer came from, for a design sold in several (wording and order). */
  occasion?: string;
  /** A design sold only as files (story, card, stickers…): shown as a picture, not as a phone invitation. */
  filesOnly?: boolean;
}) {
  const t = useTranslations('store');
  const [pkg, setPkg] = useState(defaultPackageId ?? packages[0]?.id);
  // The preview starts on a package, but none is marked chosen until the customer picks one.
  const [picked, setPicked] = useState(Boolean(defaultPackageId));
  const [names, setNames] = useState<'short' | 'long'>('short');
  const src = `/t/${lang}/${themeKey}?${new URLSearchParams({ ...(pkg ? { pkg } : {}), names, ...(occasion ? { occasion } : {}) })}`;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-20">
      <div id="preview" className="flex scroll-mt-6 flex-col items-center gap-4 lg:sticky lg:top-6">
        {filesOnly ? (
          <iframe
            key={src}
            src={src}
            title={t('filesPreview')}
            loading="lazy"
            className="block aspect-[9/16] w-full max-w-[380px] rounded-[18px] bg-surface shadow-[0_30px_60px_rgb(58_21_32/0.18)]"
          />
        ) : (
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
        )}
        <p className="max-w-[380px] text-center text-sm text-muted">{filesOnly ? t('filesOnlyHint') : t('previewHint')}</p>
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
          {filesOnly ? null : (
            <a href={src} target="_blank" rel="noopener" className="h-10 px-3 text-sm leading-10 font-medium text-accent underline underline-offset-4">
              {t('openFull')}
            </a>
          )}
        </div>
      </div>

      <section id="packages" aria-labelledby="packages-title" className="flex scroll-mt-6 flex-col gap-5">
        <h2 id="packages-title" className="font-display text-[32px] font-bold text-heading lg:text-[44px]">
          {t('packagesTitle')}
        </h2>
        {/* Customers decide with confidence: they see their real invitation before paying anything. */}
        <div data-preview-before-pay className="flex items-start gap-3 rounded-[22px] border border-accent/40 bg-accent/5 px-5 py-4">
          <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6e1f33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="flex flex-col gap-0.5">
            <span className="font-semibold text-heading">{t('previewBeforePay')}</span>
            <span className="text-sm leading-relaxed text-muted">{filesOnly ? t('previewBeforePayFiles') : t('previewBeforePayHelp')}</span>
          </span>
        </div>
        <ul className="flex flex-col gap-4">
          {packages.map((p) => {
            const selected = picked && p.id === pkg;
            return (
              <li key={p.id}>
                <div
                  data-selected={selected}
                  className="flex flex-col gap-4 rounded-[26px] border border-line bg-surface p-5 transition data-[selected=true]:border-accent data-[selected=true]:shadow-[0_14px_30px_rgb(110_31_51/0.12)] lg:p-7"
                >
                  <button type="button" onClick={() => {
                      setPkg(p.id);
                      setPicked(true);
                    }} aria-pressed={selected} className="flex items-start justify-between gap-4 text-start">
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
                      {[...(filesOnly ? [] : [t('includesLink'), p.onlineFor]), ...p.details, ...p.features].map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6e1f33" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                            <path d="M5 12l5 5 9-10" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href={`/themes/${themeKey}/order?pkg=${p.id}${occasion ? `&occasion=${occasion}` : ''}`}
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

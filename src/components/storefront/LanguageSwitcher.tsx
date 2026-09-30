'use client';

import { useLocale } from 'next-intl';
import { locales, localeMeta } from '@/i18n/config';
import { Link, usePathname } from '@/i18n/navigation';

/** Compact language menu; keeps the visitor on the same page. */
export function LanguageSwitcher({ label }: { label: string }) {
  const current = useLocale();
  const pathname = usePathname();
  const short: Record<string, string> = { ar: 'ع', en: 'EN', ckb: 'سۆ', bdn: 'با' };
  return (
    <details className="group relative">
      <summary
        aria-label={label}
        className="flex h-11 cursor-pointer list-none items-center gap-1 rounded-full px-3 text-sm font-semibold [&::-webkit-details-marker]:hidden"
      >
        {short[current] ?? current}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="transition group-open:rotate-180">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <ul className="absolute start-0 top-12 z-40 min-w-44 rounded-2xl border border-line bg-surface p-2 shadow-lg">
        {locales.map((locale) => (
          <li key={locale}>
            <Link
              href={pathname}
              locale={locale}
              lang={localeMeta[locale].htmlLang}
              dir={localeMeta[locale].dir}
              aria-current={locale === current ? 'true' : undefined}
              className={`block rounded-xl px-3 py-2.5 text-sm ${locale === current ? 'bg-blush font-semibold text-accent' : 'hover:bg-paper'}`}
            >
              {localeMeta[locale].autonym}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

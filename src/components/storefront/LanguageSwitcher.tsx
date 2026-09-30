'use client';

import { useLocale } from 'next-intl';
import { locales, localeMeta } from '@/i18n/config';
import { Link, usePathname } from '@/i18n/navigation';

/** Keeps the visitor on the same page when switching language. */
export function LanguageSwitcher({ label }: { label: string }) {
  const current = useLocale();
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
        {locales.map((locale) => (
          <li key={locale}>
            <Link
              href={pathname}
              locale={locale}
              lang={localeMeta[locale].htmlLang}
              dir={localeMeta[locale].dir}
              aria-current={locale === current ? 'true' : undefined}
              className={locale === current ? 'font-semibold text-accent' : 'text-muted hover:text-ink'}
            >
              {localeMeta[locale].autonym}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

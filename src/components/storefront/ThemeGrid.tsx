import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Price } from './currency';

export type GridTheme = { key: string; name: string; section: string; coverUrl: string | null; minPriceIqd: number | null };

const TINTS = ['bg-[#efe2ea]', 'bg-blush', 'bg-paper', 'bg-sand', 'bg-[#efd0c8]'];

/** Themes as arched cards, two across on phones. */
export async function ThemeGrid({ themes }: { themes: GridTheme[] }) {
  const t = await getTranslations('home');
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 px-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14 lg:px-[110px]">
      {themes.map((th, i) => (
        <li key={th.key} data-reveal>
          <Link href={`/themes/${th.key}`} className="group flex flex-col gap-3">
            <span
              className={`block aspect-[3/4.4] overflow-hidden rounded-t-[999px] rounded-b-[16px] transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_18px_34px_rgb(74_19_34/0.14)] ${TINTS[i % TINTS.length]}`}
            >
              {th.coverUrl ? (
                // Covers are already optimized WebP from the upload pipeline.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={th.coverUrl} alt="" loading={i < 4 ? 'eager' : 'lazy'} decoding="async" className="size-full object-cover" />
              ) : null}
            </span>
            <span className="flex flex-col gap-0.5 text-center">
              <span className="text-base font-semibold text-heading lg:text-lg">{th.name}</span>
              <span className="text-[13px] text-muted lg:text-sm">
                {th.section}
                {th.minPriceIqd ? (
                  <>
                    {' · '}
                    {t('from')} <Price iqd={th.minPriceIqd} />
                  </>
                ) : null}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Page heading in the storefront style (one `h1` per page). */
export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 pt-12 text-center lg:pt-20">
      <svg aria-hidden width="80" height="16" viewBox="0 0 60 14" fill="none" stroke="#a8834f" strokeWidth="1">
        <path d="M30 1l1.8 4.3 4.6.5-3.5 3.1 1 4.5-3.9-2.4-3.9 2.4 1-4.5-3.5-3.1 4.6-.5z" />
        <path d="M2 8h18M40 8h18" />
      </svg>
      <h1 className="bh-rise font-display text-[40px] leading-[1.3] font-bold text-heading lg:text-[64px]">{title}</h1>
      {subtitle ? <p className="bh-rise-2 max-w-xl text-[15px] leading-relaxed text-muted lg:text-lg">{subtitle}</p> : null}
    </div>
  );
}

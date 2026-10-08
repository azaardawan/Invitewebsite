import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Price } from '../currency';
import { RankBadge } from '../RankBadge';
import { SectionTitle } from './Sections';

export type TopPick = { key: string; name: string; section: string; coverUrl: string | null; minPriceIqd: number | null; rank: number };

/**
 * The owner's top 3 themes as a podium: the best seller larger in the middle (first on phones), the two top
 * picks beside it. Shown on the homepage only when the owner has chosen them (Admin → Themes).
 */
export async function TopPicks({ picks }: { picks: TopPick[] }) {
  if (!picks.length) return null;
  const t = await getTranslations('home');
  const labels = { bestSeller: t('bestSeller'), topPick: t('topPick') };
  // Desktop order puts the best seller in the middle; on phones it comes first, full width.
  const order = ['lg:order-2', 'lg:order-1', 'lg:order-3'];
  return (
    <section id="top" aria-labelledby="top-title" className="mx-auto max-w-[1440px] scroll-mt-6 pt-28 lg:pt-40">
      <SectionTitle id="top-title" title={t('topTitle')} subtitle={t('topSubtitle')} />
      <ul className="mt-10 grid grid-cols-2 items-end gap-x-4 gap-y-10 px-6 lg:mt-14 lg:flex lg:justify-center lg:gap-x-10 lg:px-[110px]">
        {picks.map((p, i) => {
          const best = p.rank === 1;
          return (
            <li key={p.key} data-reveal data-top-pick={p.rank} className={`${best ? 'col-span-2 mx-auto w-full max-w-[320px] lg:mx-0 lg:w-[340px] lg:max-w-none' : 'lg:w-[290px]'} ${order[p.rank - 1] ?? ''}`}>
              <div className="flex flex-col gap-4">
                <Link
                  href={`/themes/${p.key}`}
                  aria-label={p.name}
                  className={`group relative block overflow-visible ${best ? 'lg:-translate-y-6' : ''}`}
                >
                  <span
                    className={`block overflow-hidden rounded-t-[999px] rounded-b-[18px] bg-blush transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_18px_34px_rgb(74_19_34/0.14)] ${
                      best ? 'aspect-[3/4.2] ring-2 ring-gold-soft ring-offset-4 ring-offset-canvas' : 'aspect-[3/4.4]'
                    }`}
                  >
                    {p.coverUrl ? (
                      // Covers are already optimized WebP from the upload pipeline.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverUrl} alt="" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" className="size-full object-cover" />
                    ) : null}
                  </span>
                  <RankBadge rank={p.rank} labels={labels} className="absolute -bottom-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2" />
                </Link>
                <div className="flex flex-col gap-0.5 pt-1 text-center">
                  <h3 className={`font-semibold text-heading ${best ? 'text-xl lg:text-2xl' : 'text-base lg:text-lg'}`}>{p.name}</h3>
                  <p className="text-[13px] text-muted lg:text-sm">
                    {p.section}
                    {p.minPriceIqd ? (
                      <>
                        {' · '}
                        {t('from')} <Price iqd={p.minPriceIqd} />
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {best ? (
                    <Link href={`/themes/${p.key}#preview`} className="inline-flex h-11 items-center rounded-full border border-accent px-5 text-sm font-medium text-accent">
                      {t('preview')}
                    </Link>
                  ) : null}
                  <Link href={`/themes/${p.key}/order`} className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink">
                    {t('choose')}
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

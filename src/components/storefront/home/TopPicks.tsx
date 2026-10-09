import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Price } from '../currency';
import { RankBadge } from '../RankBadge';
import { SectionTitle } from './Sections';

export type TopPick = { key: string; name: string; section: string; coverUrl: string | null; minPriceIqd: number | null; rank: number };

/**
 * The owner's top 3 themes in one compact row (shown only when chosen in Admin → Themes).
 * Phones: a sideways row that glides and snaps card by card, the best seller first. Laptops: the three side
 * by side, the best seller in the middle and slightly larger; the other two lift and brighten under the mouse.
 */
export async function TopPicks({ picks }: { picks: TopPick[] }) {
  if (!picks.length) return null;
  const t = await getTranslations('home');
  const labels = { bestSeller: t('bestSeller'), topPick: t('topPick') };
  // Laptop order puts the best seller in the middle.
  const order = ['lg:order-2', 'lg:order-1', 'lg:order-3'];
  return (
    <section id="top" aria-labelledby="top-title" className="mx-auto max-w-[1440px] scroll-mt-6 pt-20 lg:pt-28">
      <SectionTitle id="top-title" title={t('topTitle')} subtitle={t('topSubtitle')} />
      <ul className="no-scrollbar mt-8 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto scroll-smooth px-6 pt-2 pb-6 lg:mt-10 lg:snap-none lg:items-end lg:justify-center lg:gap-8 lg:overflow-visible lg:px-[110px]">
        {picks.map((p, i) => {
          const best = p.rank === 1;
          return (
            <li
              key={p.key}
              data-top-pick={p.rank}
              className={`group w-[62vw] max-w-[250px] shrink-0 snap-start ${order[p.rank - 1] ?? ''} ${
                best
                  ? 'lg:w-[280px] lg:max-w-none'
                  : 'lg:w-[240px] lg:max-w-none lg:opacity-85 lg:transition lg:duration-500 lg:ease-[cubic-bezier(.2,.7,.2,1)] lg:hover:-translate-y-2 lg:hover:opacity-100 lg:focus-within:-translate-y-2 lg:focus-within:opacity-100'
              }`}
            >
              <div className="flex flex-col gap-3">
                <Link href={`/themes/${p.key}`} aria-label={p.name} className="relative block">
                  <span
                    className={`block aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-[16px] bg-blush transition duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${
                      best
                        ? 'ring-2 ring-gold-soft ring-offset-4 ring-offset-canvas'
                        : 'group-hover:shadow-[0_18px_34px_rgb(74_19_34/0.16)] group-hover:ring-2 group-hover:ring-gold-soft/70 group-hover:ring-offset-4 group-hover:ring-offset-canvas'
                    }`}
                  >
                    {p.coverUrl ? (
                      // Covers are already optimized WebP from the upload pipeline.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.coverUrl}
                        alt=""
                        loading={i === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="size-full object-cover transition duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </span>
                  <RankBadge rank={p.rank} labels={labels} className="absolute -bottom-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2" />
                </Link>
                <div className="flex flex-col gap-0.5 pt-1 text-center">
                  <h3 className={`font-semibold text-heading ${best ? 'text-lg lg:text-xl' : 'text-base lg:text-lg'}`}>{p.name}</h3>
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
                <div className="flex justify-center">
                  <Link href={`/themes/${p.key}/order`} className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink">
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

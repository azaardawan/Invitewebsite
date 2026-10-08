'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Price } from '../currency';
import { RankBadge } from '../RankBadge';

export type CarouselTheme = {
  key: string;
  name: string;
  section: string;
  coverUrl: string | null;
  minPriceIqd: number | null;
  rank?: number | null;
};

const TINTS = ['bg-[#efe2ea]', 'bg-blush', 'bg-paper', 'bg-sand', 'bg-[#efd0c8]'];

/**
 * Sideways theme carousel (owner request): native swipe with snap points, so
 * it glides under the finger; arrows and dots move smoothly; the card in
 * focus comes forward. Works right-to-left and left-to-right.
 */
export function ThemeCarousel({
  themes,
  labels,
}: {
  themes: CarouselTheme[];
  labels: { prev: string; next: string; preview: string; choose: string; from: string; bestSeller: string; topPick: string };
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const step = useCallback(() => {
    const el = track.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return 1;
    const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 0;
    return first.offsetWidth + gap;
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setActive(Math.round(Math.abs(el.scrollLeft) / step())));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [step]);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const target = Math.max(0, Math.min(themes.length - 1, i));
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.scrollTo({ left: (rtl ? -1 : 1) * target * step() });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end gap-2 px-6 lg:px-[110px]">
        <button
          type="button"
          onClick={() => go(active - 1)}
          disabled={active === 0}
          aria-label={labels.prev}
          className="flex size-11 items-center justify-center rounded-full border border-accent text-accent transition disabled:opacity-30 lg:size-14"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="rtl:rotate-0 ltr:rotate-180">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => go(active + 1)}
          disabled={active >= themes.length - 1}
          aria-label={labels.next}
          className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-ink transition disabled:opacity-30 lg:size-14"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="rtl:rotate-0 ltr:rotate-180">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>

      <div
        ref={track}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[calc(50%-128px)] pt-2 pb-5 lg:gap-8 lg:px-[110px]"
      >
        {themes.map((t, i) => (
          <article
            key={t.key}
            data-active={i === active}
            className="flex w-[256px] shrink-0 snap-center flex-col gap-4 transition duration-700 ease-[cubic-bezier(.2,.7,.2,1)] data-[active=false]:scale-[.92] data-[active=false]:opacity-60 lg:w-[300px] lg:snap-start lg:data-[active=false]:scale-100 lg:data-[active=false]:opacity-100"
          >
            <Link
              href={`/themes/${t.key}`}
              aria-label={t.name}
              className={`relative block h-[340px] overflow-hidden rounded-t-[128px] rounded-b-[18px] lg:h-[400px] lg:rounded-t-[150px] ${TINTS[i % TINTS.length]}`}
            >
              <RankBadge rank={t.rank} labels={labels} className="absolute bottom-3 start-1/2 z-10 -translate-x-1/2 rtl:translate-x-1/2" />
              {t.coverUrl ? (
                // Covers are already optimized WebP from the upload pipeline.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.coverUrl} alt="" loading={i < 2 ? 'eager' : 'lazy'} decoding="async" className="size-full object-cover" />
              ) : null}
            </Link>
            <div className="flex flex-col gap-1 text-center lg:text-start">
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <p className="text-sm text-muted">
                {t.section}
                {t.minPriceIqd ? (
                  <>
                    {' · '}
                    {labels.from} <Price iqd={t.minPriceIqd} />
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex justify-center gap-2 lg:justify-start">
              <Link href={`/themes/${t.key}#preview`} className="inline-flex h-11 items-center rounded-full border border-accent px-5 text-sm font-medium text-accent">
                {labels.preview}
              </Link>
              <Link href={`/themes/${t.key}/order`} className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink">
                {labels.choose}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="flex justify-center gap-1">
        {themes.map((t, i) => (
          <button key={t.key} type="button" onClick={() => go(i)} aria-label={t.name} aria-current={i === active} className="flex h-6 w-9 items-center justify-center">
            <span className={`block h-2 rounded-full transition-all duration-500 ${i === active ? 'w-6 bg-accent' : 'w-2 bg-[#d9bdb4]'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

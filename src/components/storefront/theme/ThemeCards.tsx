'use client';

import { useEffect, useRef, useState } from 'react';

const PX_PER_MM = 96 / 25.4;

export type ThemeCardView = {
  key: string;
  name: string;
  /** Packages that include this card. */
  packages: string[];
  sides: { side: 'front' | 'back'; widthMm: number; heightMm: number; src: string }[];
};

/** One side of a card: the real printed page, drawn at its size and scaled to the box. */
function CardSide({ widthMm, heightMm, src, title }: { widthMm: number; heightMm: number; src: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const w = widthMm * PX_PER_MM;
  const h = heightMm * PX_PER_MM;
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / w);
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(el);
    return () => watch.disconnect();
  }, [w]);
  return (
    <div ref={box} className="relative w-full overflow-hidden rounded-[10px] bg-surface shadow-[0_14px_30px_rgb(58_21_32/0.14)]" style={{ aspectRatio: `${widthMm} / ${heightMm}` }}>
      {scale ? (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          tabIndex={-1}
          className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
          style={{ width: w, height: h, transform: `scale(${scale})` }}
        />
      ) : null}
    </div>
  );
}

/**
 * The printed cards a design offers (owner, 2026-11-18), each with its front and back as samples with the example
 * names and the «sample» watermark, and the packages that include it. Each side opens full size.
 */
export function ThemeCards({ cards, labels }: { cards: ThemeCardView[]; labels: { title: string; intro: string; front: string; back: string; includedIn: string; open: string } }) {
  return (
    <section id="cards" aria-labelledby="cards-title" className="mt-16 scroll-mt-6 lg:mt-24">
      <h2 id="cards-title" className="font-display text-[32px] font-bold text-heading lg:text-[44px]">
        {labels.title}
      </h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{labels.intro}</p>
      <ul className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <li key={c.key} className="flex flex-col gap-4 rounded-[26px] border border-line bg-paper p-5 lg:p-6">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-semibold text-heading">{c.name}</span>
              {c.packages.length ? (
                <span className="text-sm text-muted">
                  {labels.includedIn} {c.packages.join(' · ')}
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-2 items-end gap-4">
              {c.sides.map((s) => (
                <figure key={s.side} className="flex flex-col gap-2">
                  <a href={s.src} target="_blank" rel="noopener" aria-label={`${c.name}: ${s.side === 'front' ? labels.front : labels.back} (${labels.open})`} className="block transition hover:-translate-y-0.5">
                    <CardSide widthMm={s.widthMm} heightMm={s.heightMm} src={s.src} title={`${c.name}: ${s.side === 'front' ? labels.front : labels.back}`} />
                  </a>
                  <figcaption className="text-center text-xs font-medium text-muted">{s.side === 'front' ? labels.front : labels.back}</figcaption>
                </figure>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

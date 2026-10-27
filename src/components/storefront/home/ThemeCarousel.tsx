'use client';

import { useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { RankBadge } from '../RankBadge';
import { coverImageStyle, type CoverFocus } from '@/lib/cover-focus';

export type CarouselTheme = {
  key: string;
  name: string;
  section: string;
  coverUrl: string | null;
  coverFocus?: CoverFocus | null;
  minPriceIqd: number | null;
  rank?: number | null;
};

const TINTS = ['bg-[#efe2ea]', 'bg-blush', 'bg-paper', 'bg-sand', 'bg-[#efd0c8]'];

/** Gentle drift, in pixels per second. */
const DRIFT = 22;
/** The drift comes back this long after the visitor lets go. */
const RESUME_MS = 2500;
/** Moving less than this is a tap (opens the design), more is a swipe. */
const TAP_PX = 8;

/**
 * The homepage's designs (owner request, 2026-10-27): rounded cards in one endless row that drifts slowly on its
 * own and loops without a seam. Visitors swipe it freely either way (with momentum); the drift pauses while they
 * do and comes back a moment after. Tapping a card opens the design. The row is drawn in copies side by side and
 * moved with a transform, so the loop never shows a jump; only the first copy is read out and reachable by
 * keyboard. No drift for visitors who asked for less motion, or while it is off screen.
 */
export function ThemeCarousel({ themes, labels }: { themes: CarouselTheme[]; labels: { bestSeller: string; topPick: string; hint: string } }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  // Enough copies to fill the widest screen with room to loop.
  const copies = Math.max(3, Math.ceil(12 / Math.max(1, themes.length)) + 2);

  useEffect(() => {
    const view = viewport.current;
    const row = track.current;
    if (!view || !row) return;
    // The row itself is laid out left to right; the page's language decides which way it drifts.
    const rtl = getComputedStyle(view.parentElement ?? view).direction === 'rtl';
    // In Arabic and Kurdish the row drifts to the right (new designs come in from the left), as the page reads.
    const driftSign = rtl ? -1 : 1;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    let setWidth = 1;
    const measure = () => {
      const first = row.children[0] as HTMLElement | undefined;
      const second = row.children[themes.length] as HTMLElement | undefined;
      setWidth = first && second ? Math.abs(second.offsetLeft - first.offsetLeft) : row.scrollWidth / copies;
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(row);

    // `offset`: how far the row has moved, kept within one copy so it loops.
    let offset = 0;
    let velocity = 0;
    let dragging = false;
    let pointer: { id: number; x: number; y: number; at: number; startX: number; moved: boolean; horizontal: boolean | null } | null = null;
    let resumeAt = 0;
    let visible = true;
    let last = performance.now();
    let frame = 0;

    const render = () => {
      offset = ((offset % setWidth) + setWidth) % setWidth;
      // Within one copy either way, the copies after it keep the screen full; the loop point looks the same.
      row.style.transform = `translate3d(${-offset}px, 0, 0)`;
    };

    const tick = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      if (!dragging) {
        if (Math.abs(velocity) > 5) {
          // Momentum after a swipe, slowing down like a native scroll.
          offset += velocity * dt;
          velocity *= Math.pow(0.04, dt);
        } else {
          velocity = 0;
          if (visible && !reduced.matches && now >= resumeAt && !document.hidden) offset += driftSign * DRIFT * dt;
        }
      }
      render();
      frame = requestAnimationFrame(tick);
    };

    const hold = () => {
      resumeAt = Number.POSITIVE_INFINITY;
    };
    const release = () => {
      resumeAt = performance.now() + RESUME_MS;
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now(), startX: e.clientX, moved: false, horizontal: null };
      velocity = 0;
      hold();
    };
    const move = (e: PointerEvent) => {
      if (!pointer || e.pointerId !== pointer.id) return;
      const dx = e.clientX - pointer.x;
      const dy = e.clientY - pointer.y;
      // Decide once whether this is a sideways swipe (ours) or the page scrolling up and down (the browser's).
      if (pointer.horizontal === null && Math.hypot(dx, dy) > 4) pointer.horizontal = Math.abs(dx) > Math.abs(dy);
      if (!pointer.horizontal) return;
      if (!dragging) {
        dragging = true;
        view.setPointerCapture(e.pointerId);
      }
      const now = performance.now();
      offset -= dx;
      velocity = (-dx / Math.max(1, now - pointer.at)) * 1000;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.at = now;
      if (Math.abs(e.clientX - pointer.startX) > TAP_PX) pointer.moved = true;
    };
    const up = (e: PointerEvent) => {
      if (!pointer || e.pointerId !== pointer.id) return;
      // A pause before letting go means no fling.
      if (performance.now() - pointer.at > 80) velocity = 0;
      dragging = false;
      release();
      if (!pointer.moved) pointer = null;
    };
    // A swipe that ends on a card must not open it.
    const click = (e: MouseEvent) => {
      if (pointer?.moved) {
        e.preventDefault();
        e.stopPropagation();
      }
      pointer = null;
    };
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      offset += e.deltaX;
      velocity = 0;
      release();
    };
    // Keyboard: a focused card is brought into view and the row waits.
    const focus = (e: FocusEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-carousel-card]');
      if (!card) return;
      hold();
      const box = view.getBoundingClientRect();
      const r = card.getBoundingClientRect();
      if (r.left < box.left) offset -= box.left - r.left + 24;
      else if (r.right > box.right) offset += r.right - box.right + 24;
    };
    const blur = () => release();

    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    });
    io.observe(view);

    view.addEventListener('pointerdown', down);
    view.addEventListener('pointermove', move);
    view.addEventListener('pointerup', up);
    view.addEventListener('pointercancel', up);
    view.addEventListener('click', click, true);
    view.addEventListener('wheel', wheel, { passive: false });
    view.addEventListener('focusin', focus);
    view.addEventListener('focusout', blur);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      io.disconnect();
      view.removeEventListener('pointerdown', down);
      view.removeEventListener('pointermove', move);
      view.removeEventListener('pointerup', up);
      view.removeEventListener('pointercancel', up);
      view.removeEventListener('click', click, true);
      view.removeEventListener('wheel', wheel);
      view.removeEventListener('focusin', focus);
      view.removeEventListener('focusout', blur);
    };
  }, [themes.length, copies]);

  return (
    <div className="flex flex-col gap-5">
      {/* Laid out left to right in every language (so the copies line up from the left edge); the drift direction
          follows the page's language instead. */}
      <div ref={viewport} dir="ltr" className="relative cursor-grab touch-pan-y overflow-hidden py-3 select-none active:cursor-grabbing" data-design-row>
        <div ref={track} className="flex w-max gap-4 will-change-transform lg:gap-7">
          {Array.from({ length: copies }, (_, copy) =>
            themes.map((t, i) => (
              <Link
                key={`${copy}-${t.key}`}
                href={`/themes/${t.key}`}
                draggable={false}
                aria-hidden={copy > 0 ? true : undefined}
                tabIndex={copy > 0 ? -1 : undefined}
                data-carousel-card={copy === 0 ? t.key : undefined}
                className="group flex w-[148px] shrink-0 flex-col gap-2.5 outline-none sm:w-[190px] lg:w-[236px]"
              >
                <span
                  className={`relative block aspect-[5/7] overflow-hidden rounded-[18px] shadow-[0_14px_30px_rgb(58_21_32/0.16)] ring-1 ring-black/5 transition duration-300 group-focus-visible:ring-2 group-focus-visible:ring-accent lg:rounded-[24px] ${TINTS[i % TINTS.length]}`}
                >
                  {t.coverUrl ? (
                    // Covers are already optimized WebP from the upload pipeline.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.coverUrl}
                      alt=""
                      draggable={false}
                      loading={copy === 0 && i < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="pointer-events-none size-full object-cover"
                      style={coverImageStyle(t.coverFocus)}
                    />
                  ) : null}
                  <RankBadge rank={t.rank} labels={labels} className="absolute bottom-2.5 start-1/2 z-10 -translate-x-1/2 rtl:translate-x-1/2" />
                </span>
                <span className="truncate text-center text-sm font-medium text-heading" dir="auto">
                  {t.name}
                </span>
              </Link>
            )),
          )}
        </div>
      </div>
      <p className="text-center text-sm text-muted">{labels.hint}</p>
    </div>
  );
}

import { useEffect, type RefObject } from 'react';

/**
 * The design's scroll reveals: each marked line (`data-reveal`) is drawn in from the reading side the first time it
 * scrolls into view, the way a pen writes it. Off with reduced motion (the caller passes `active = false`); the
 * text is never hidden before or without the animation, so nothing depends on it.
 */
export function useScrollReveal(root: RefObject<HTMLElement | null>, dir: 'rtl' | 'ltr', active: boolean) {
  useEffect(() => {
    const el = root.current;
    if (!active || !el || typeof IntersectionObserver === 'undefined') return;
    const running = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const n = entry.target as HTMLElement;
          observer.unobserve(n);
          const from = dir === 'rtl' ? 'inset(-25% 0 -25% 100%)' : 'inset(-25% 100% -25% 0)';
          const a = n.animate(
            [
              { clipPath: from, transform: 'translateY(9px)' },
              { clipPath: 'inset(-25% -10% -25% -10%)', transform: 'translateY(0)' },
            ],
            { duration: Math.min(1500, Math.max(800, (n.textContent?.length ?? 0) * 28)), easing: 'cubic-bezier(.2,.6,.25,1)' },
          );
          running.add(a);
          a.onfinish = () => running.delete(a);
        }
      },
      { threshold: 0.18 },
    );
    el.querySelectorAll('[data-reveal]').forEach((n) => observer.observe(n));
    return () => {
      observer.disconnect();
      running.forEach((a) => a.cancel());
    };
  }, [root, dir, active]);
}

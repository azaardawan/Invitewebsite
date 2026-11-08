'use client';

import { useEffect, useRef } from 'react';

export type ShrinkText = { text: string; scale: number };

const norm = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

/**
 * Writes the customer's long texts smaller wherever the design shows them (owner, 2026-11-08): each element that holds
 * one of `texts` (the smallest one holding all of it) gets its letters scaled by `scale`, its own and its children's,
 * so the text takes the room a text that fits takes. Works on any design without changing it (versions on sale are
 * frozen), on the invitation as it opens and changes, and on printed cards. `root`: where to look (the page when
 * omitted). While it has not run yet, `[data-bahja-fit-pending]` is in the page, so the PDF renderer waits for it.
 */
export function FitLongTexts({ texts, root }: { texts: ShrinkText[]; root?: string }) {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const scope = (root ? document.querySelector(root) : document.body) ?? document.body;
    const apply = () => {
      for (const { text, scale } of texts) {
        const want = norm(text);
        for (const el of scope.querySelectorAll<HTMLElement>('*')) {
          if (el.dataset.bahjaFit || el.matches('script, style, input, textarea, [role="note"]')) continue;
          if (!norm(el.textContent).includes(want)) continue;
          if ([...el.children].some((c) => norm(c.textContent).includes(want))) continue;
          // Measure everything first, then set: no size is scaled twice.
          const parts = [el, ...el.querySelectorAll<HTMLElement>('*')];
          const sizes = parts.map((p) => parseFloat(getComputedStyle(p).fontSize));
          parts.forEach((p, i) => {
            if (sizes[i]) p.style.fontSize = `${sizes[i]! * scale}px`;
            p.dataset.bahjaFit = '1';
          });
        }
      }
    };
    apply();
    marker.current?.removeAttribute('data-bahja-fit-pending');
    // The invitation changes as it opens: newly shown texts get the same treatment.
    let frame = 0;
    const watch = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    });
    watch.observe(scope, { childList: true, subtree: true, characterData: true });
    return () => {
      watch.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [texts, root]);
  return texts.length ? <span ref={marker} hidden data-bahja-fit-pending="" /> : null;
}

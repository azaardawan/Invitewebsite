'use client';

import { useEffect, useRef } from 'react';
import type { SignatureDrawing } from '@/theme-sdk/print';

/**
 * Guests' signatures in the keepsake (owner, 2026-11-27), for every design, frozen versions included: each signature
 * goes right under the line the design prints for its guest (`guestName`, else the bare name), in the order the
 * messages come, in that line's own ink. A design that draws the signatures itself (`data-bahja-guest-signature`)
 * is left as it is. While this runs, the page is marked busy so the PDF waits for it (src/server/documents/render.ts).
 */
export function KeepsakeSignatures({ items }: { items: { guestName: string; name: string; signature: SignatureDrawing | null }[] }) {
  const pending = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const root = document.body;
    if (!root.querySelector('[data-bahja-guest-signature]')) {
      const used = new Set<Element>();
      // A design may dress the line ("— Sara · Coming", "~ Sara ~"): the dashes, dots and spaces around it don't count.
      const bare = (t: string | null | undefined) => (t ?? '').replace(/^[\s—–\-~·•:]+|[\s—–\-~·•:]+$/g, '');
      // The innermost elements whose whole text is `text`, in page order, not yet given a signature.
      const lines = (text: string) =>
        [...root.querySelectorAll('p, span, div, footer, h3, h4, cite, figcaption, strong, em, b, i, small')].filter(
          (el) => !used.has(el) && bare(el.textContent) === text && ![...el.children].some((c) => bare(c.textContent) === text),
        );
      for (const item of items) {
        const line = lines(item.guestName)[0] ?? lines(item.name)[0];
        if (!line) continue;
        used.add(line);
        if (!item.signature) continue;
        const box = document.createElement('div');
        box.setAttribute('data-bahja-guest-signature', '');
        box.setAttribute('aria-hidden', 'true');
        const style = getComputedStyle(line);
        Object.assign(box.style, { height: '1.1cm', margin: '0.1cm 0 0', textAlign: style.textAlign, color: style.color, breakBefore: 'avoid', pageBreakBefore: 'avoid' });
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', item.signature.viewBox);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        Object.assign(svg.style, { height: '100%', width: 'auto', maxWidth: '60%', display: 'inline-block', overflow: 'visible' });
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', item.signature.d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', String(item.signature.lineWidth));
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.appendChild(path);
        box.appendChild(svg);
        line.after(box);
      }
    }
    pending.current?.removeAttribute('data-bahja-fit-pending');
  }, [items]);
  return <span ref={pending} data-bahja-fit-pending="" hidden />;
}

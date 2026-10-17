'use client';

import { useEffect, useState } from 'react';
import type { ThemePhoto, ThemeProps } from '@/theme-sdk/types';
import { ThemeHost } from '@/theme-registry/loaders.generated';
import { setForcedReducedMotion } from '@/theme-sdk/runtime';

/** Messages from the customer's photo editor (same site only). */
type PhotoMessage =
  | { type: 'bahja:photos'; photos: Omit<ThemePhoto, 'label' | 'index'>[] }
  | { type: 'bahja:show-photo'; index: number };

/**
 * The theme, with the customer's photos kept live: the photo editor on the order page (or the receipt) sends each
 * change as it happens (moved, zoomed, added, removed, reordered) and the design redraws at once, then scrolls to the
 * photo being edited and outlines it. With `?photoEdit=1` the design starts already open (no entrance), so the
 * photos are in view. Messages from other sites are ignored.
 */
export function LiveThemeHost({ codeRef, props }: { codeRef: string; props: ThemeProps }) {
  const [photos, setPhotos] = useState(props.photos);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editing = params.get('photoEdit') === '1';
    if (editing) setForcedReducedMotion(true);
    const show = (index: number) => {
      // After the design has drawn the change.
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(`[data-bahja-photo="${index}"]`);
        if (!el) return;
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        el.style.outline = '3px solid #c0396b';
        el.style.outlineOffset = '2px';
        window.setTimeout(() => {
          el.style.outline = '';
          el.style.outlineOffset = '';
        }, 1600);
      });
    };
    const start = Number(params.get('photo'));
    if (editing && Number.isInteger(start)) window.setTimeout(() => show(start), 400);
    const onMessage = (e: MessageEvent<PhotoMessage>) => {
      if (e.origin !== window.location.origin || !e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'bahja:photos' && Array.isArray(e.data.photos)) {
        // The design's names for each place stay as they were.
        setPhotos(e.data.photos.map((p, index) => ({ ...p, index, label: props.photos[index]?.label ?? null })));
      } else if (e.data.type === 'bahja:show-photo' && Number.isInteger(e.data.index)) {
        show(e.data.index);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [props.photos]);

  return <ThemeHost codeRef={codeRef} {...props} photos={photos} />;
}

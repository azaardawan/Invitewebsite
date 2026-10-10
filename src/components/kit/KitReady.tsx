'use client';

import { useEffect } from 'react';

/** Tells the file generator the page is ready: fonts loaded and every image decoded. */
export function KitReady() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await document.fonts.ready;
      // Theme chunks load lazily; give them a moment to mount before looking for images.
      for (let i = 0; i < 50 && !document.querySelector('[data-kit-unit] *'); i++) await new Promise((r) => setTimeout(r, 100));
      const pending = () => [...document.images].filter((img) => !img.complete);
      for (let i = 0; i < 100 && pending().length; i++) await new Promise((r) => setTimeout(r, 100));
      await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined)));
      await document.fonts.ready;
      if (!cancelled) document.body.dataset.kitReady = '1';
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}

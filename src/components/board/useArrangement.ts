'use client';

import { useEffect, useRef, useState } from 'react';
import type { BoardArrangement } from '@/catalog/signature-board';
import { arrange } from './layout';
import { drawNote } from './BoardCanvas';
import type { BoardNote } from './types';

/**
 * The boards' arrangement in the browser: the saved one, with any new messages placed and every note inked, worked
 * out once the fonts are in (notes are measured in the first board's message area, `fieldRef`). `ready` turns true
 * once it is done; `heights` are the notes' heights (share of the area), for neighbour checks while editing.
 */
export function useArrangement(notes: BoardNote[], opts: { perBoard: number; saved: BoardArrangement | null; inks: number; rtl: boolean }) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<{ arrangement: BoardArrangement | null; heights: Record<string, number>; ready: boolean }>({ arrangement: null, heights: {}, ready: false });
  const { perBoard, saved, inks, rtl } = opts;
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await document.fonts.ready;
      const field = fieldRef.current;
      if (cancelled || !field) return;
      const out = arrange(field, notes, { perBoard, saved, inks, rtl, drawNote });
      if (!cancelled) setState({ ...out, ready: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [notes, perBoard, saved, inks, rtl]);
  return { fieldRef, ...state, setState };
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { touchesKeepOut, type BoardArea, type BoardArrangement, type BoardKeepOut } from '@/catalog/signature-board';
import { arrange } from './layout';
import { drawNote } from './BoardCanvas';
import type { BoardNote } from './types';

/**
 * The boards' arrangement in the browser: the saved one, with any new messages placed and every note inked, worked
 * out once the fonts are in (notes are measured in the first board's message area, `fieldRef`). `ready` turns true
 * once it is done; `heights` are the notes' heights (share of the area), for neighbour checks while editing.
 */
export function useArrangement(
  notes: BoardNote[],
  opts: { perBoard: number; saved: BoardArrangement | null; inks: number; rtl: boolean; keepOut?: BoardKeepOut | null; area?: BoardArea },
) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<{ arrangement: BoardArrangement | null; heights: Record<string, number>; ready: boolean }>({ arrangement: null, heights: {}, ready: false });
  const { perBoard, saved, inks, rtl, keepOut, area } = opts;
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await document.fonts.ready;
      const field = fieldRef.current;
      if (cancelled || !field) return;
      const blocked = keepOut && area ? (box: { x: number; y: number; w: number; h: number }) => touchesKeepOut(keepOut, area, box) : undefined;
      const out = arrange(field, notes, { perBoard, saved, inks, rtl, drawNote, blocked });
      if (!cancelled) setState({ ...out, ready: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [notes, perBoard, saved, inks, rtl, keepOut, area]);
  return { fieldRef, ...state, setState };
}

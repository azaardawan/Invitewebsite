'use client';

import { BoardCanvas } from './BoardCanvas';
import { useArrangement } from './useArrangement';
import type { BoardView } from './types';

/**
 * One board as printed (the PNG and PDF, and Admin's preview): laid out in the page, then shown. While the layout
 * runs, the page is marked busy so the renderer waits for it (src/server/documents/render.ts).
 */
export function BoardPrint({ view, board }: { view: BoardView; board: number }) {
  const { fieldRef, arrangement, ready } = useArrangement(view.notes, {
    perBoard: view.perBoard,
    saved: view.arrangement,
    inks: view.design.inks.length,
    rtl: view.dir === 'rtl',
    keepOut: view.design.keepOut,
    area: view.design.area,
  });
  return (
    <>
      <BoardCanvas
        design={view.design}
        heading={view.heading}
        dir={view.dir}
        lang={view.lang}
        notes={view.notes}
        arrangement={arrangement}
        board={board}
        fieldRef={fieldRef}
      />
      {/* How many boards there are, for the renderer making the PDF (one page each). */}
      {ready ? <span data-board-count={arrangement?.scales.length ?? 1} hidden /> : <span data-bahja-fit-pending="" hidden />}
    </>
  );
}

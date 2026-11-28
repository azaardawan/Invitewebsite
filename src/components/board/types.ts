import type { BoardArea, BoardArrangement, BoardKeepOut } from '@/catalog/signature-board';
import type { SignatureDrawing } from '@/lib/signature-strokes';

export type BoardFont = 'ruqaa' | 'sans' | 'vazir';

/** One guest message on the board: the reply's id, the guest's name, the message and their signature. */
export type BoardNote = { id: string; name: string; message: string; signature: SignatureDrawing | null };

/** The design's board artwork and how messages are written on it (src/catalog/signature-board.ts). */
export type BoardDesignView = {
  src: string;
  widthMm: number;
  heightMm: number;
  area: BoardArea;
  /** The ink colours, in order. */
  inks: string[];
  title: boolean;
  titleColor: string;
  titleFont: BoardFont;
  font: BoardFont;
  /** Where the artwork is decorated: messages are never laid there (null = anywhere in the area). */
  keepOut: BoardKeepOut | null;
};

/** Everything the board needs, from the server (src/server/board/data.ts). */
export type BoardView = {
  design: BoardDesignView;
  heading: { names: string; subtitle: string } | null;
  notes: BoardNote[];
  perBoard: number;
  arrangement: BoardArrangement | null;
  dir: 'rtl' | 'ltr';
  lang: string;
  occasion: string | null;
};

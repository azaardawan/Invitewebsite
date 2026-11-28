import 'server-only';
import sharp from 'sharp';
import type { BoardKeepOut } from '@/catalog/signature-board';

/** The grid the artwork is read on: this many cells across (rows follow the board's shape). */
export const KEEP_OUT_COLS = 60;
/** Pixels per cell side when reading the artwork. */
const SUB = 4;
/** How far a pixel's colour must be from the paper's to count as drawing (0–441, RGB distance). */
const INK = 46;
/** A sharp edge (Sobel magnitude) counts as drawing too, so fine line art on a busy paper is found. */
const EDGE = 90;
/** A cell is part of the design when this share of its pixels is drawing. */
const FILL = 0.1;

/**
 * Finds where a signature board's artwork is decorated (owner, 2026-11-28: flowers, frames, crests, ribbons), so no
 * message or signature is laid over them. The artwork is read on a grid of KEEP_OUT_COLS cells across: a cell is
 * decoration when enough of it differs from the paper (the artwork's most common colour) or has sharp edges. Lone
 * specks are ignored, and every decoration gets one cell of space around it.
 */
export async function detectKeepOut(image: Buffer, widthMm: number, heightMm: number): Promise<BoardKeepOut> {
  const cols = KEEP_OUT_COLS;
  const rows = Math.max(1, Math.round((cols * heightMm) / widthMm));
  const W = cols * SUB;
  const H = rows * SUB;
  const { data } = await sharp(image, { limitInputPixels: 400_000_000 })
    .flatten({ background: '#ffffff' })
    .resize(W, H, { fit: 'fill' })
    .blur(0.6)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // The paper: the most common colour (in coarse bins), averaged within its bin.
  const bins = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 3]!;
    const g = data[i * 3 + 1]!;
    const b = data[i * 3 + 2]!;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bin = bins.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bin.n++;
    bin.r += r;
    bin.g += g;
    bin.b += b;
    bins.set(key, bin);
  }
  const top = [...bins.values()].sort((a, b) => b.n - a.n)[0]!;
  const paper = [top.r / top.n, top.g / top.n, top.b / top.n] as const;

  const lum = (x: number, y: number) => {
    const i = (Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 3;
    return 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
  };
  const drawn = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      const d = Math.hypot(data[i]! - paper[0], data[i + 1]! - paper[1], data[i + 2]! - paper[2]);
      const gx = lum(x + 1, y - 1) + 2 * lum(x + 1, y) + lum(x + 1, y + 1) - lum(x - 1, y - 1) - 2 * lum(x - 1, y) - lum(x - 1, y + 1);
      const gy = lum(x - 1, y + 1) + 2 * lum(x, y + 1) + lum(x + 1, y + 1) - lum(x - 1, y - 1) - 2 * lum(x, y - 1) - lum(x + 1, y - 1);
      drawn[y * W + x] = d > INK || Math.hypot(gx, gy) > EDGE ? 1 : 0;
    }
  }

  let cells = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let n = 0;
      for (let y = 0; y < SUB; y++) for (let x = 0; x < SUB; x++) n += drawn[(r * SUB + y) * W + c * SUB + x]!;
      cells[r * cols + c] = n / (SUB * SUB) >= FILL ? 1 : 0;
    }
  }
  const at = (g: Uint8Array, r: number, c: number) => (r >= 0 && r < rows && c >= 0 && c < cols ? g[r * cols + c]! : 0);
  // Lone specks (a dot of texture, a stray mark) are not decoration.
  const cleaned = new Uint8Array(cells);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!cells[r * cols + c]) continue;
      let neighbours = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) neighbours += at(cells, r + dr, c + dc);
      if (neighbours === 0) cleaned[r * cols + c] = 0;
    }
  }
  cells = cleaned;
  // A cell of space around every decoration.
  const grown = new Uint8Array(cells);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (cells[r * cols + c]) continue;
      for (let dr = -1; dr <= 1 && !grown[r * cols + c]; dr++) for (let dc = -1; dc <= 1; dc++) if (at(cells, r + dr, c + dc)) grown[r * cols + c] = 1;
    }
  }
  return { cols, rows, cells: Array.from(grown).join('') };
}

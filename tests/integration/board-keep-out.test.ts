import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { detectKeepOut } from '@/server/board/keep-out';

/** The board's artwork is read for decoration when the owner saves it (owner, 2026-11-28). */
describe('finding the decoration on board artwork', () => {
  it('marks a flower and leaves the plain paper free', async () => {
    // 600 × 900 ivory paper, a pink flower in the top-left corner, a faint paper texture dot elsewhere.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#fbf6ef"/><circle cx="80" cy="80" r="45" fill="#d98aa0"/><circle cx="400" cy="600" r="1" fill="#f3ece2"/></svg>`;
    const k = await detectKeepOut(await sharp(Buffer.from(svg)).png().toBuffer(), 600, 900);
    expect(k.cols).toBe(60);
    expect(k.rows).toBe(90);
    const at = (xPx: number, yPx: number) => k.cells[Math.floor((yPx / 900) * k.rows) * k.cols + Math.floor((xPx / 600) * k.cols)];
    expect(at(80, 80)).toBe('1');
    // A cell of margin around it.
    expect(at(80 + 45 + 8, 80)).toBe('1');
    // Plain paper, and the barely visible dot, stay free.
    expect(at(300, 450)).toBe('0');
    expect(at(400, 600)).toBe('0');
  });
});

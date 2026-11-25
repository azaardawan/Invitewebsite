/**
 * The printed frames (manifest `print.shapes`), from the owner's poster artwork: each frame's cut line (mm, in its own
 * box) and where its lines of text sit, as on the poster: `x` centre and `y` first baseline in % of the card, `w` the
 * widest line (%), `size` in mm, `track` letter-spacing in mm, `lines`/`gap` (% of the height) for a block of lines.
 * Generated from the artwork; the art itself is assets/frame-<art>.svg (front) and -back.svg (the frame alone).
 */
import type { Frame } from './PosterShape';

export const FRAMES = {
  arch: {
    art: 'wavy',
    widthMm: 174.0,
    heightMm: 272.4,
    outline: 'M33 0 Q87 13.2 141 0 Q144.6 14.4 165.6 19.2 Q156 64.2 165.6 100.2 Q174 136.2 165.6 172.2 Q156 208.2 165.6 253.2 Q144.6 258 141 272.4 Q87 259.2 33 272.4 Q29.4 258 8.4 253.2 Q18 208.2 8.4 172.2 Q0 136.2 8.4 100.2 Q18 64.2 8.4 19.2 Q29.4 14.4 33 0 Z',
    slots: {
      kicker: { x: 50.0, y: 16.577, w: 45.802, size: 5.072, color: '#78291f', font: 'serif', track: 0.411, upper: true, lines: 2, gap: 2.66 },
      message: { x: 50.0, y: 58.777, w: 59.959, size: 7.245, color: '#78291f', font: 'serif', lines: 2, gap: 3.67 },
      date: { x: 50.0, y: 70.746, w: 61.069, size: 8.211, color: '#78291f', font: 'serif' },
      time: { x: 50.0, y: 74.558, w: 68.009, size: 6.521, color: '#78291f', font: 'serif' },
      venue: { x: 50.0, y: 78.813, w: 49.966, size: 7.004, color: '#78291f', font: 'serif' },
    },
    boxes: {
      title: [22.935, 21.098, 54.129, 16.047],
      strip1: [25.259, 41.85, 26.638, 4.736],
      strip2: [48.276, 44.273, 26.724, 4.736],
    },
  },
} as const satisfies Record<string, Frame>;

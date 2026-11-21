/**
 * The printed frames (manifest `print.shapes`), from the owner's poster artwork: each frame's cut line (mm, in its own
 * box) and where its lines of text sit, as on the poster: `x` centre and `y` first baseline in % of the card, `w` the
 * widest line (%), `size` in mm, `track` letter-spacing in mm, `lines`/`gap` (% of the height) for a block of lines.
 * Generated from the artwork; the art itself is assets/frame-<art>.svg (front) and -back.svg (the frame alone).
 */
import type { Frame } from './PosterShape';

export const FRAMES = {
  arch: {
    art: 'crest',
    widthMm: 181.2,
    heightMm: 282.0,
    outline: 'M90.6 0 C79.8 17.4 40.8 22.2 13.2 15.6 C22.2 51 0 66 7.8 96.6 C13.8 118.8 13.8 163.2 7.8 185.4 C0 216 22.2 231 13.2 266.4 C40.8 259.8 79.8 264.6 90.6 282 C101.4 264.6 140.4 259.8 168 266.4 C159 231 181.2 216 173.4 185.4 C167.4 163.2 167.4 118.8 173.4 96.6 C181.2 66 159 51 168 15.6 C140.4 22.2 101.4 17.4 90.6 0 Z',
    slots: {
      kicker: { x: 50.0, y: 19.149, w: 60.43, size: 7.8, color: '#38271f', font: 'serif', track: 0.6, upper: true },
      name1: { x: 50.0, y: 31.17, w: 49.669, size: 22.697, color: '#38271f', font: 'script' },
      and: { x: 50.0, y: 38.617, w: 49.669, size: 9.0, color: '#38271f', font: 'serif' },
      name2: { x: 50.0, y: 46.064, w: 49.669, size: 22.403, color: '#38271f', font: 'script' },
      message: { x: 50.0, y: 60.106, w: 69.536, size: 8.4, color: '#38271f', font: 'serif', lines: 2, gap: 4.111 },
      date: { x: 50.0, y: 71.064, w: 72.848, size: 10.2, color: '#38271f', font: 'serif' },
      time: { x: 50.0, y: 75.638, w: 81.126, size: 8.1, color: '#38271f', font: 'serif' },
      venue: { x: 50.0, y: 80.745, w: 71.192, size: 8.7, color: '#38271f', font: 'serif' },
    },
  },
} as const satisfies Record<string, Frame>;

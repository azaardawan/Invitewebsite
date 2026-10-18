/**
 * The printed frames (manifest `print.shapes`), from the owner's poster artwork: each frame's cut line (mm, in its own
 * box) and where its lines of text sit, as on the poster: `x` centre and `y` first baseline in % of the card, `w` the
 * widest line (%), `size` in mm, `track` letter-spacing in mm, `lines`/`gap` (% of the height) for a block of lines.
 * Generated from the artwork; the art itself is assets/frame-<art>.svg (front) and -back.svg (the frame alone).
 */
import type { Frame } from './PosterShape';

export const FRAMES = {
  'arch-oval': {
    art: 'oval',
    widthMm: 181.2,
    heightMm: 280.8,
    outline: 'M90.6 0 C145.2 0 181.2 62.4 181.2 140.4 C181.2 218.4 145.2 280.8 90.6 280.8 C36 280.8 0 218.4 0 140.4 C0 62.4 36 0 90.6 0 Z',
    slots: {
      classOf: { x: 50.0, y: 37.74, w: 66.929, size: 7.177, color: '#20443b', font: 'serif', track: 0.742, upper: true },
      title: { x: 50.0, y: 42.5, w: 56.002, size: 10.89, color: '#20443b', font: 'serif', track: 0.742, upper: true },
      name: { x: 50.0, y: 50.609, w: 56.002, size: 18.81, color: '#20443b', font: 'serif' },
      achievement: { x: 50.0, y: 57.66, w: 56.002, size: 7.177, color: '#20443b', font: 'serif' },
      message: { x: 50.0, y: 65.681, w: 54.636, size: 6.93, color: '#20443b', font: 'serif', lines: 2, gap: 3.406 },
      date: { x: 50.0, y: 75.288, w: 60.099, size: 8.415, color: '#20443b', font: 'serif' },
      time: { x: 50.0, y: 79.079, w: 66.929, size: 6.682, color: '#20443b', font: 'serif' },
      venue: { x: 50.0, y: 83.309, w: 49.855, size: 7.177, color: '#20443b', font: 'serif' },
    },
  },
  'arch-corners': {
    art: 'corners',
    widthMm: 175.2,
    heightMm: 271.2,
    outline: 'M22.2 0 L153 0 Q155.1 20.7 175.2 22.8 L175.2 248.4 Q155.1 250.5 153 271.2 L22.2 271.2 Q20.1 250.5 0 248.4 L0 22.8 Q20.1 20.7 22.2 0 Z',
    slots: {
      classOf: { x: 50.0, y: 35.315, w: 82.646, size: 8.569, color: '#20443b', font: 'serif', track: 0.886, upper: true },
      title: { x: 50.0, y: 41.199, w: 69.152, size: 13.002, color: '#20443b', font: 'serif', track: 0.886, upper: true },
      name: { x: 50.0, y: 51.223, w: 69.152, size: 22.458, color: '#20443b', font: 'serif' },
      achievement: { x: 50.0, y: 59.94, w: 69.152, size: 8.569, color: '#20443b', font: 'serif' },
      message: { x: 50.0, y: 69.856, w: 67.466, size: 8.274, color: '#20443b', font: 'serif', lines: 2, gap: 4.21 },
      date: { x: 50.0, y: 81.732, w: 74.212, size: 10.047, color: '#20443b', font: 'serif' },
      time: { x: 50.0, y: 86.418, w: 82.646, size: 7.978, color: '#20443b', font: 'serif' },
      venue: { x: 50.0, y: 91.648, w: 61.562, size: 8.569, color: '#20443b', font: 'serif' },
    },
  },
} as const satisfies Record<string, Frame>;

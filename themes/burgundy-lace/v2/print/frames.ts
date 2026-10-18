/**
 * The printed frames (manifest `print.shapes`), from the owner's poster artwork: each frame's cut line (mm, in its own
 * box) and where its lines of text sit, as on the poster: `x` centre and `y` first baseline in % of the card, `w` the
 * widest line (%), `size` in mm, `track` letter-spacing in mm, `lines`/`gap` (% of the height) for a block of lines.
 * Generated from the artwork; the art itself is assets/frame-<art>.svg (front) and -back.svg (the frame alone).
 */
import type { Frame } from './PosterShape';

export const FRAMES = {
  'arch-cut': {
    art: 'cut',
    widthMm: 180.0,
    heightMm: 272.4,
    outline: 'M27.6 0 L152.4 0 L180 27.6 L180 244.8 L152.4 272.4 L27.6 272.4 L0 244.8 L0 27.6 Z',
    slots: {
      kicker: { x: 50.0, y: 8.345, w: 69.875, size: 8.19, color: '#f5ecda', font: 'serif', track: 0.877, upper: true },
      name1: { x: 50.0, y: 33.579, w: 43.062, size: 19.725, color: '#5d1d20', font: 'script' },
      and: { x: 50.0, y: 41.096, w: 43.062, size: 8.775, color: '#5d1d20', font: 'serif' },
      name2: { x: 50.0, y: 48.612, w: 43.062, size: 19.468, color: '#5d1d20', font: 'script' },
      message: { x: 50.0, y: 69.766, w: 68.25, size: 7.897, color: '#f5ecda', font: 'serif', lines: 2, gap: 4.001 },
      date: { x: 50.0, y: 79.001, w: 71.5, size: 9.36, color: '#f5ecda', font: 'serif' },
      timeVenue: { x: 50.0, y: 82.866, w: 74.75, size: 7.605, color: '#f5ecda', font: 'serif' },
    },
    boxes: {
      seal: [43.5, 85.658, 13.0, 8.59],
    },
  },
  'arch-corners': {
    art: 'corners',
    widthMm: 175.2,
    heightMm: 271.2,
    outline: 'M22.2 0 L153 0 Q155.1 20.7 175.2 22.8 L175.2 248.4 Q155.1 250.5 153 271.2 L22.2 271.2 Q20.1 250.5 0 248.4 L0 22.8 Q20.1 20.7 22.2 0 Z',
    slots: {
      kicker: { x: 50.0, y: 8.161, w: 71.789, size: 8.19, color: '#f5ecda', font: 'serif', track: 0.877, upper: true },
      name1: { x: 50.0, y: 33.507, w: 44.242, size: 19.725, color: '#5d1d20', font: 'script' },
      and: { x: 50.0, y: 41.056, w: 44.242, size: 8.775, color: '#5d1d20', font: 'serif' },
      name2: { x: 50.0, y: 48.606, w: 44.242, size: 19.468, color: '#5d1d20', font: 'script' },
      message: { x: 50.0, y: 69.853, w: 70.12, size: 7.897, color: '#f5ecda', font: 'serif', lines: 2, gap: 4.019 },
      date: { x: 50.0, y: 79.129, w: 73.459, size: 9.36, color: '#f5ecda', font: 'serif' },
      timeVenue: { x: 50.0, y: 83.012, w: 76.798, size: 7.605, color: '#f5ecda', font: 'serif' },
    },
    boxes: {
      seal: [43.322, 85.816, 13.356, 8.628],
    },
  },
} as const satisfies Record<string, Frame>;

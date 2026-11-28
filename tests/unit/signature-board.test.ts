import { describe, expect, it } from 'vitest';
import { BOARD_INKS, boardSection, boardsNeeded, MAX_BOARDS, parseArrangement, touchesKeepOut } from '@/catalog/signature-board';
import { inkFor, near } from '@/components/board/layout';
import { signatureDrawing } from '@/lib/signature-strokes';

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

/** The signature board (owner, 2026-11-27): its rules, checked without a browser. */
describe('signature board', () => {
  it('is for weddings and newborns', () => {
    expect(boardSection('wedding')).toBe(true);
    expect(boardSection('newborn')).toBe(true);
    expect(boardSection('engagement')).toBe(false);
    expect(boardSection(null)).toBe(false);
  });

  it('starts another board when one is full', () => {
    expect(boardsNeeded(0, 30)).toBe(1);
    expect(boardsNeeded(30, 30)).toBe(1);
    expect(boardsNeeded(31, 30)).toBe(2);
    expect(boardsNeeded(10_000, 30)).toBe(MAX_BOARDS);
  });

  it('keeps a saved arrangement and drops anything malformed', () => {
    const good = { b: 1, x: 10, y: 20, w: 18.5, r: -2.5, c: 3 };
    const parsed = parseArrangement({ v: 1, scales: [1.1, 0.9], spots: { [ID(1)]: good, [ID(2)]: { ...good, c: 99 }, 'not-an-id': good, [ID(3)]: { ...good, b: 0.5 } } });
    expect(parsed).toEqual({ v: 1, scales: [1.1, 0.9], spots: { [ID(1)]: good } });
    expect(parseArrangement({ v: 2, scales: [], spots: {} })).toBeNull();
    expect(parseArrangement('nonsense')).toBeNull();
    // A board beyond the limit is refused.
    expect(parseArrangement({ v: 1, scales: [1], spots: { [ID(1)]: { ...good, b: 1 } } }, { boards: 1 })!.spots).toEqual({});
  });

  it('never gives neighbours the same ink', () => {
    const inks = BOARD_INKS.dark.length;
    // A note in the middle with a neighbour on every side, each in a different ink but one.
    const box = { x: 40, y: 40, w: 20, h: 10 };
    const around = [
      { box: { x: 18, y: 40, w: 20, h: 10 }, c: 0 },
      { box: { x: 62, y: 40, w: 20, h: 10 }, c: 1 },
      { box: { x: 40, y: 28, w: 20, h: 10 }, c: 2 },
      { box: { x: 40, y: 52, w: 20, h: 10 }, c: 3 },
      { box: { x: 18, y: 28, w: 20, h: 10 }, c: 4 },
      { box: { x: 62, y: 52, w: 20, h: 10 }, c: 5 },
    ];
    expect(around.every((o) => near(box, o.box))).toBe(true);
    expect(inkFor(ID(9), box, around, inks)).toBe(6);
    // Its own ink stays when it is still free; a taken one changes.
    expect(inkFor(ID(9), box, around.slice(0, 2), inks, 4)).toBe(4);
    expect(inkFor(ID(9), box, around.slice(0, 2), inks, 1)).not.toBe(1);
    // Far away is not a neighbour.
    expect(near(box, { x: 90, y: 90, w: 5, h: 5 })).toBe(false);
  });

  it('draws a stored signature as one SVG path', () => {
    const d = signatureDrawing({ w: 200, h: 100, s: [[10, 50, 0, 40, 30, 20, 80, 60, 40], [100, 50, 80]] });
    expect(d!.d.match(/M/g)).toHaveLength(2);
    expect(d!.viewBox.split(' ').map(Number)[2]).toBeGreaterThan(80);
    expect(signatureDrawing(null)).toBeNull();
  });
});

describe('signature board: the artwork\'s decoration', () => {
  const area = { top: 10, right: 10, bottom: 10, left: 10 };
  // A 10 × 10 grid with one decorated cell in the middle (row 5, column 5).
  const keepOut = { cols: 10, rows: 10, cells: Array.from({ length: 100 }, (_, i) => (i === 55 ? '1' : '0')).join('') };

  it('tells a note on the decoration from one beside it', () => {
    // The middle cell is 50–60% of the board; on the message area (10–90%) that is 50–62.5%.
    expect(touchesKeepOut(keepOut, area, { x: 45, y: 45, w: 10, h: 10 })).toBe(true);
    expect(touchesKeepOut(keepOut, area, { x: 0, y: 0, w: 30, h: 30 })).toBe(false);
    expect(touchesKeepOut(keepOut, area, { x: 70, y: 45, w: 20, h: 10 })).toBe(false);
    expect(touchesKeepOut(null, area, { x: 45, y: 45, w: 10, h: 10 })).toBe(false);
  });
});

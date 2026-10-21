import { describe, expect, it } from 'vitest';
import { parseSignatureStrokes, strokePath, strokesBox, strokeTimeline, STROKE_LIMITS } from '@/lib/signature-strokes';

const good = { w: 300, h: 160, s: [[10, 20, 0, 50, 60, 100, 90, 40, 220], [120, 80, 5000, 140, 90, 5100]] };

describe('signature strokes', () => {
  it('accepts what the pad sends and rejects anything else', () => {
    expect(parseSignatureStrokes(JSON.stringify(good))).toEqual(good);
    expect(parseSignatureStrokes('')).toBeNull();
    expect(parseSignatureStrokes('not json')).toBeNull();
    expect(parseSignatureStrokes({ ...good, s: [[1, 2]] })).toBeNull();
    expect(parseSignatureStrokes({ ...good, s: [[1, 2, 5, 3, 4, 1]] })).toBeNull(); // time runs backwards
    expect(parseSignatureStrokes({ ...good, w: 0 })).toBeNull();
    expect(parseSignatureStrokes({ ...good, s: [[1, 2, 'x']] })).toBeNull();
    expect(parseSignatureStrokes({ ...good, s: Array.from({ length: STROKE_LIMITS.strokes + 1 }, (_, i) => [1, 1, i]) })).toBeNull();
    expect(parseSignatureStrokes('x'.repeat(STROKE_LIMITS.bytes + 1))).toBeNull();
  });

  it('plays at the customer’s pace, with long pauses shortened, in 1 to 3 seconds', () => {
    const t = strokeTimeline(good);
    // Stroke 1 took 220 ms, the pause of 4.8 s becomes 150 ms, stroke 2 took 100 ms: 470 ms → stretched to 1 s.
    expect(t[0]!.start).toBe(0);
    expect(t[1]!.start).toBeCloseTo((370 / 470) * 1000, 5);
    expect(t[1]!.start + t[1]!.duration).toBeCloseTo(1000, 5);
    const slow = { ...good, s: [[0, 0, 0, 10, 10, 20000]] };
    expect(strokeTimeline(slow)[0]!.duration).toBeCloseTo(3000, 5);
  });

  it('fits the ink like the stored picture, and draws a path through every stroke', () => {
    const box = strokesBox(good);
    for (const [k, v] of Object.entries({ x: 8.7, y: 18.7, width: 132.6, height: 72.6 })) expect(box[k as keyof typeof box]).toBeCloseTo(v, 6);
    expect(strokePath([5, 5, 0])).toBe('M5 5l0.01 0');
    expect(strokePath(good.s[0]!)).toBe('M10 20Q50 60 70 50L90 40');
  });
});

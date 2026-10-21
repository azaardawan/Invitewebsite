/**
 * How a customer drew their signature, so the invitation can draw it again at their own pace. Coordinates are the
 * drawing pad's CSS pixels (`w` × `h`); each stroke is a flat list `x, y, t, x, y, t, …` with `t` the milliseconds
 * since the first touch. Kept small: points closer than a pixel or two are dropped while drawing.
 */
export type SignatureStrokes = { w: number; h: number; s: number[][] };

export const STROKE_LIMITS = {
  strokes: 60,
  points: 3000,
  /** The JSON as sent by the pad. */
  bytes: 64 * 1024,
  side: 4000,
  /** Ten minutes of drawing, at most. */
  ms: 600_000,
} as const;

/** The pad's line width in its own pixels (the PNG is drawn with the same). */
export const SIGNATURE_LINE_WIDTH = 2.6;

/** The strokes sent by the pad, checked; null for anything malformed (the signature then simply appears). */
export function parseSignatureStrokes(input: unknown): SignatureStrokes | null {
  let value = input;
  if (typeof input === 'string') {
    if (!input || input.length > STROKE_LIMITS.bytes) return null;
    try {
      value = JSON.parse(input);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== 'object') return null;
  const { w, h, s } = value as Record<string, unknown>;
  const side = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= STROKE_LIMITS.side;
  if (!side(w) || !side(h) || !Array.isArray(s) || !s.length || s.length > STROKE_LIMITS.strokes) return null;
  let points = 0;
  let lastT = -1;
  const strokes: number[][] = [];
  for (const stroke of s) {
    if (!Array.isArray(stroke) || stroke.length < 3 || stroke.length % 3 !== 0) return null;
    points += stroke.length / 3;
    if (points > STROKE_LIMITS.points) return null;
    const clean: number[] = [];
    for (let i = 0; i < stroke.length; i += 3) {
      const [x, y, t] = [stroke[i], stroke[i + 1], stroke[i + 2]];
      if (![x, y, t].every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
      if (x < -50 || y < -50 || x > w + 50 || y > h + 50 || t < 0 || t > STROKE_LIMITS.ms || t < lastT) return null;
      lastT = t;
      clean.push(Math.round(x * 10) / 10, Math.round(y * 10) / 10, Math.round(t));
    }
    strokes.push(clean);
  }
  return { w: Math.round(w), h: Math.round(h), s: strokes };
}

/** The box the ink fills (what the stored picture is cropped to), with half a line around it. */
export function strokesBox(strokes: SignatureStrokes) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of strokes.s) {
    for (let i = 0; i < s.length; i += 3) {
      minX = Math.min(minX, s[i]!);
      maxX = Math.max(maxX, s[i]!);
      minY = Math.min(minY, s[i + 1]!);
      maxY = Math.max(maxY, s[i + 1]!);
    }
  }
  // Ink past the pad's edge isn't in the picture: the box stops at the edge, as the picture does.
  const pad = SIGNATURE_LINE_WIDTH / 2;
  const x0 = Math.max(0, minX - pad);
  const y0 = Math.max(0, minY - pad);
  const x1 = Math.min(strokes.w, maxX + pad);
  const y1 = Math.min(strokes.h, maxY + pad);
  return { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) };
}

/**
 * When each stroke starts and how long it takes (ms) on playback: the customer's own rhythm, with pauses between
 * strokes shortened to at most `maxGap`, scaled so the whole signature takes between `min` and `max`.
 */
export function strokeTimeline(strokes: SignatureStrokes, opts: { min?: number; max?: number; maxGap?: number } = {}) {
  const { min = 1000, max = 3000, maxGap = 150 } = opts;
  const raw: { start: number; duration: number }[] = [];
  let clock = 0;
  let prevEnd: number | null = null;
  for (const s of strokes.s) {
    const t0 = s[2]!;
    const t1 = s[s.length - 1]!;
    if (prevEnd !== null) clock += Math.min(maxGap, Math.max(0, t0 - prevEnd));
    // A dot or a very quick flick still needs a moment to be seen.
    const duration = Math.max(60, t1 - t0);
    raw.push({ start: clock, duration });
    clock += duration;
    prevEnd = t1;
  }
  const total = clock || 1;
  const scale = Math.min(max, Math.max(min, total)) / total;
  return raw.map((r) => ({ start: r.start * scale, duration: r.duration * scale }));
}

/** An SVG path through a stroke's points, smoothed through the midpoints like the pad draws it. */
export function strokePath(stroke: readonly number[]) {
  const n = stroke.length / 3;
  const x = (i: number) => stroke[i * 3]!;
  const y = (i: number) => stroke[i * 3 + 1]!;
  if (n === 1) return `M${x(0)} ${y(0)}l0.01 0`;
  let d = `M${x(0)} ${y(0)}`;
  for (let i = 1; i < n - 1; i++) d += `Q${x(i)} ${y(i)} ${(x(i) + x(i + 1)) / 2} ${(y(i) + y(i + 1)) / 2}`;
  return `${d}L${x(n - 1)} ${y(n - 1)}`;
}

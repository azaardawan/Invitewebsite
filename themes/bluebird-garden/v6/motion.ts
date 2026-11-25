/**
 * The cover's satin ribbon, from the designer's opening.js: the bands across the cover, the bow and its tails, at a
 * moment of the opening (`elapsed` ms; -1 while it waits, gently swaying). Pure geometry: the theme applies it to the
 * ribbon's SVG on animation frames. The paper doors, the bunting and the lettering move in CSS alongside.
 */
export const OPENING_MS = 2900;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const between = (a: number, b: number, n: number) => {
  const t = clamp01((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const round = (n: number) => Math.round(n * 100) / 100;
type Pt = [number, number];

function curve(points: Pt[], move = true) {
  let d = `${move ? 'M' : 'L'}${round(points[0]![0])},${round(points[0]![1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)]!,
      b = points[i]!,
      c = points[i + 1]!,
      e = points[Math.min(points.length - 1, i + 2)]!;
    d += ` C${round(b[0] + (c[0] - a[0]) / 6)},${round(b[1] + (c[1] - a[1]) / 6)} ${round(c[0] - (e[0] - b[0]) / 6)},${round(c[1] - (e[1] - b[1]) / 6)} ${round(c[0])},${round(c[1])}`;
  }
  return d;
}

function strip(points: Pt[], widths: number[]) {
  const upper: Pt[] = [],
    lower: Pt[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(0, i - 1)]!,
      b = points[Math.min(points.length - 1, i + 1)]!,
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      len = Math.hypot(dx, dy) || 1,
      r = widths[i]! / 2;
    upper.push([points[i]![0] - (dy / len) * r, points[i]![1] + (dx / len) * r]);
    lower.push([points[i]![0] + (dy / len) * r, points[i]![1] - (dx / len) * r]);
  }
  return curve(upper) + curve(lower.reverse(), false) + ' Z';
}

export type RibbonKey = 'bandLeft' | 'bandRight' | 'tailLeft' | 'tailRight';
export type RibbonFrame = {
  paths: Record<RibbonKey, string>;
  opacity: number;
  loopOpacity: number;
  knotOpacity: number;
  leftTransform: string;
  rightTransform: string;
  knotTransform: string;
};

/** The ribbon in a `width` × `height` cover; `clock` (ms) drives the idle sway, `hover` the bow's little pinch. */
export function ribbonFrame(width: number, height: number, elapsed = -1, clock = 0, hover = 0): RibbonFrame {
  const idle = elapsed < 0,
    t = idle ? 0 : elapsed,
    s = Math.max(0.74, Math.min(1.22, width / 510)),
    x = width / 2,
    y = height * (width <= 700 ? 0.62 : 0.61);
  const loosen = between(180, 820, t),
    fly = between(650, 1560, t),
    release = between(380, 1470, t),
    sway = idle ? Math.sin(clock * 0.0014) * 1.5 : Math.sin(t * 0.018) * 2 * (1 - loosen),
    pinch = idle ? 1 + hover * 0.035 : 1 + 0.055 * Math.sin(Math.PI * clamp01(t / 270));
  const paths = {} as Record<RibbonKey, string>;
  for (const side of [-1, 1]) {
    const label = side < 0 ? 'Left' : 'Right',
      tail: Pt[] = [],
      widths: number[] = [],
      band: Pt[] = [],
      bandWidths: number[] = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16,
        phase = idle ? clock * 0.0015 : t * 0.006,
        flutter = Math.sin(u * 6.5 - phase + side * 0.6) * (idle ? 4 : 32 * loosen * (1 - fly)) * u * u;
      tail.push([
        x + side * s * (7 + 29 * u + 17 * Math.sin(u * 4.3) + flutter + loosen * 54 * u) + side * fly * (width * 0.68 + 145),
        y + s * (7 + 139 * u + Math.sin(u * 6 - phase) * 3 * u - loosen * 43 * u) + fly * 83 + sway,
      ]);
      widths.push(s * (20 - 4 * u) * (1 - 0.42 * loosen * Math.abs(Math.sin(u * 5 - phase))));
      const edge = side < 0 ? -35 : width + 35,
        free = x + side * release * (width * 0.56 + 100);
      band.push([edge + (free - edge) * u, y + release * s * (Math.sin(u * 6.2 - t * 0.005 + side) * 34 * u + side * 68 * u * u)]);
      bandWidths.push(s * 17 * (1 - 0.32 * release * Math.sin(u * Math.PI) ** 2));
    }
    paths[`tail${label}` as RibbonKey] = strip(tail, widths);
    paths[`band${label}` as RibbonKey] = strip(band, bandWidths);
  }
  const sx = s * pinch * (1 - 0.91 * loosen),
    sy = s * pinch * (1 - 0.74 * loosen);
  return {
    paths,
    opacity: 1 - between(1420, 1710, t),
    loopOpacity: 1 - between(610, 870, t),
    knotOpacity: 1 - between(460, 820, t),
    leftTransform: `translate(${round(x - loosen * 38 * s)},${round(y + sway)}) rotate(${round(-sway - 18 * loosen)}) scale(${round(sx)},${round(sy)})`,
    rightTransform: `translate(${round(x + loosen * 38 * s)},${round(y + sway)}) rotate(${round(sway + 22 * loosen)}) scale(${round(sx)},${round(sy)})`,
    knotTransform: `translate(${round(x + loosen * 13 * s)},${round(y + sway - loosen * 16 * s)}) rotate(${round(sway + loosen * 68)}) scale(${round(s * pinch * (1 - 0.45 * loosen))})`,
  };
}

/** Whole days since the date of birth (`YYYY-MM-DD`), counted in the guest's own calendar day; null if not a date. */
export function daysSince(iso: string | undefined, today: string) {
  const parse = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? Date.UTC(+v.slice(0, 4), +v.slice(5, 7) - 1, +v.slice(8, 10)) : NaN);
  if (!iso) return null;
  const days = Math.floor((parse(today) - parse(iso.slice(0, 10))) / 86400000);
  return Number.isFinite(days) ? days : null;
}

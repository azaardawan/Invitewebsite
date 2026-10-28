import { blooms, strokes } from './writing';

/**
 * The designer's floral motion engine (motion.js), ported. Times are the designer's (a 10-second sequence); the
 * page plays them SPEED times faster so the lettering is written and the cake is in bloom within about four seconds.
 * The «Birthday» calligraphy writes itself with the designer's pen strokes; the customer's lines (name, date…) are
 * written by a pen-wide wipe in the reading direction.
 */
export const SPEED = 1.75;
export const WRITING_END = 6.65;
export const SETTLE_DURATION = 1.05;
export const DURATION = 10;

/** The invitation's lines on the poster, and when (designer time) each is written. */
export type LineKey = 'name' | 'eyebrow' | 'party' | 'details' | 'address';
export const LINE_TIMES: Record<LineKey, readonly [number, number]> = {
  eyebrow: [0.18, 1.12],
  name: [1.3, 0.68],
  party: [4.79, 0.52],
  details: [5.31, 0.68],
  address: [6.02, 0.63],
};

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const smooth = (x: number) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
const f = (x: number) => Math.round(x * 10000) / 10000;
const angles = [-4, 2, -1, 5, 0, -3, 1];
/** A step of a looping sequence (any integer frame). */
const step = (list: readonly number[], frame: number) => list[((frame % list.length) + list.length) % list.length] ?? 0;
const starPositions = [
  [48, 105, 2.3],
  [249, 119, 3.1],
  [41, 218, 2.6],
  [253, 228, 2.2],
  [79, 270, 2.8],
  [218, 274, 2.4],
  [68, 65, 2.1],
  [232, 56, 2.2],
] as const;
const flamePivots = [
  [115, 79],
  [135, 78],
  [151.5, 75],
  [173.5, 78],
  [189.5, 75],
] as const;

export type Petal = { id: number; side: number; delay: number; speed: number; drift: number; phase: number; size: number };
export const petals: Petal[] = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  side: i % 2 ? 1 : -1,
  delay: 6.9 + (i % 7) * 0.13,
  speed: 12 + ((i * 17) % 19),
  drift: 9 + ((i * 11) % 13),
  phase: i * 2.399,
  size: 0.7 + (i % 4) * 0.15,
}));

function petalState(p: Petal, t: number) {
  const age = Math.max(0, t - p.delay),
    side = p.side;
  return {
    x: 149 + side * (66 + age * p.speed * 0.58) + Math.sin(age * 2.4 + p.phase) * 6,
    y: 158 - age * 25 + age * age * 16 + Math.sin(age * 2 + p.phase) * 4,
    rotation: side * age * 38 + Math.sin(age * 3 + p.phase) * 16,
    scaleX: Math.max(0.18, Math.abs(Math.cos(age * 2 + p.phase))),
    opacity: t > p.delay && t < DURATION ? smooth(age / 0.25) * (1 - smooth((age - 2) / 0.9)) : 0,
  };
}

function ribbonPath(side: number, t: number) {
  const u = t - 7.2;
  const origin = side < 0 ? 54 : 244;
  let d = '';
  for (let i = 0; i < 19; i++) {
    const q = i / 18,
      x = origin + Math.sin(q * 10 - u * 2.5) * 8 * q + side * u * 7,
      y = 174 + q * 70 * Math.min(1, Math.max(0, u) * 1.4) + u * u * 8;
    d += (i ? ' L ' : 'M ') + f(x) + ' ' + f(y);
  }
  return d;
}

/** Where each of the customer's lines is written: its centre and the widest it may be (poster units). */
export type LineBox = { y: number; height: number; max: number; rtl: boolean };

export type DrawOptions = { idle?: boolean; reduced?: boolean; ambient?: boolean; lines?: Partial<Record<LineKey, LineBox>> };
type Attrs = Record<string, string | number>;

/** Every animated attribute at designer time `time`, by element id. */
export function sceneState(time: number, { idle = false, reduced = false, ambient = false, lines = {} }: DrawOptions = {}) {
  const t = idle ? 0 : reduced ? DURATION : Math.max(0, time);
  const state: Record<string, Attrs> = {};
  const set = (id: string, value: Attrs) => (state[id] = value);
  const tick = reduced ? 0 : t;
  flamePivots.forEach(([x, y], i) => {
    const frame = Math.floor(tick / 0.28 + i * 1.7),
      angle = reduced ? 0 : step(angles, frame) * 0.6;
    set('flame-' + i, { transform: `rotate(${angle} ${x} ${y})`, opacity: reduced ? 1 : step([1, 0.78, 0.96, 0.86], frame) });
  });
  starPositions.forEach(([x, y, size], i) => {
    const frame = Math.floor(tick / 0.43 + i * 1.3);
    set('opening-star-' + i, {
      transform: `translate(${x} ${y}) rotate(${reduced ? 0 : step(angles, frame)}) scale(${f((size / 3) * (reduced ? 1 : step([1, 0.8, 1.15, 0.92], frame)))})`,
      opacity: reduced ? 1 : step([1, 0.48, 1, 0.76], frame),
    });
  });
  if (ambient) return state;
  for (const s of strokes) {
    const progress = idle ? 0 : clamp((t - s.start) / Math.max(0.001, s.duration));
    set(s.id, { 'stroke-dashoffset': f(1 - progress), opacity: progress > 0 ? 1 : 0 });
  }
  for (const [key, box] of Object.entries(lines) as [LineKey, LineBox][]) {
    const [start, duration] = LINE_TIMES[key];
    const u = idle ? 0 : smooth((t - start) / duration);
    const width = f(box.max * u + (u > 0 ? 6 : 0));
    const left = 148.875 - box.max / 2 - 3;
    set('wipe-' + key, { x: f(box.rtl ? left + box.max + 6 - width : left), y: f(box.y - box.height), width, height: f(box.height * 1.6) });
  }
  set('invitation-seal', { opacity: idle ? 1 : 1 - ease(t / 0.32), transform: `translate(149 203) scale(${f(1 + ease(t / 0.4) * 0.12)})` });
  // During writing the title sits in the open centre of the paper; it then settles into its place as the cake blooms.
  const settle = idle ? 0 : ease((t - WRITING_END) / SETTLE_DURATION);
  for (const group of ['title', 'party']) set('text-' + group, { transform: `translate(0 ${f(-84 * (1 - settle))})` });
  set('floral-cake', { opacity: idle || t < 6.8 ? 0 : 1, mask: t >= 9.4 ? 'none' : 'url(#floral-bloom)' });
  blooms.forEach(([, , r, start], i) => set('bloom-' + i, { r: f(r * ease((t - start) / 1.1)) }));
  set('opening-stars', { opacity: idle ? 0 : smooth((t - 8.25) / 0.75) });
  for (const p of petals) {
    const s = petalState(p, t);
    set('petal-' + p.id, {
      opacity: idle || reduced ? 0 : f(s.opacity),
      transform: `translate(${f(s.x)} ${f(s.y)}) rotate(${f(s.rotation)}) scale(${f(p.size * s.scaleX)} ${p.size})`,
    });
  }
  for (const side of [-1, 1]) set('ribbon-' + side, { d: ribbonPath(side, t), opacity: idle || reduced ? 0 : f(smooth((t - 7.2) / 0.3) * (1 - smooth((t - 9) / 0.65))) });
  return state;
}

/** How tall the stage is: the screen while the lettering is written, then the poster's own height (as the designer's page). */
export function stageHeight(time: number, initial: number, final: number, { idle = false, reduced = false } = {}) {
  const u = idle ? 0 : reduced ? 1 : clamp((time - WRITING_END) / SETTLE_DURATION);
  return initial + (final - initial) * smooth(u);
}

/**
 * Draws the scene into the rendered SVG: only attributes that changed are written. Ids carry the instance prefix,
 * which `prefix` strips; a mask reference gets it back.
 */
export function createRenderer(svg: SVGSVGElement, prefix: string) {
  const nodes = new Map<string, Element>();
  svg.querySelectorAll('[id]').forEach((n) => nodes.set(n.id.startsWith(prefix) ? n.id.slice(prefix.length) : n.id, n));
  const letters = [...svg.querySelectorAll<SVGGElement>('[data-end]')];
  const applied = new Map<string, string>();
  const write = (node: Element, key: string, value: string | number) => {
    const cacheKey = node.id + ':' + key;
    const text = String(value).replace('url(#', `url(#${prefix}`);
    if (applied.get(cacheKey) === text) return;
    node.setAttribute(key, text);
    applied.set(cacheKey, text);
  };
  return (time: number, options: DrawOptions = {}) => {
    const state = sceneState(time, options);
    for (const [id, attrs] of Object.entries(state)) {
      const node = nodes.get(id);
      if (node) for (const [k, v] of Object.entries(attrs)) write(node, k, v);
    }
    if (!options.ambient)
      for (const n of letters) {
        const done = !options.idle && (options.reduced || time >= Number(n.dataset.end));
        write(n, 'mask', done ? 'none' : `url(#write-${n.id.slice(prefix.length)})`);
      }
    return state;
  };
}

/*
 * The poster's opening, from the designer's motion.js: one deterministic scene. `sceneState(time)` gives every
 * animated element's attributes at that moment (ids without the instance prefix); the theme applies them to the
 * inline poster each frame. 156 confetti pieces, 23 ribbons and 34 stars burst from the party popper while the cake
 * and the lettering settle in; then only the stars twinkle.
 */
export const DURATION = 5.8;
/** The lettering is in place by then; the website opens below while the last confetti falls. */
export const SETTLED = 3;
const INK = '#fff7f2';
const PINK = '#e8b5a8';
const TAU = Math.PI * 2;
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
const smooth = (t: number) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
const fmt = (n: number) => Math.round(n * 1000) / 1000;
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const rand = random(19032028);
const angleFrames = [-7, 4, -3, 8, 0, -5, 3];

export type Layout = {
  pixelWidth: number;
  pixelHeight: number;
  scale: number;
  width: number;
  openingHeight: number;
  fullHeight: number;
  artX: number;
  artY: number;
};
export function frameLayout(pixelWidth = 535, pixelHeight = 496): Layout {
  const width = Math.max(1, pixelWidth),
    height = Math.max(1, pixelHeight);
  const scale = Math.min(width, 760) / 297.75;
  const worldWidth = width / scale,
    openingHeight = height / scale;
  const fullHeight = Math.max(419.25, openingHeight);
  return { pixelWidth: width, pixelHeight: height, scale, width: worldWidth, openingHeight, fullHeight, artX: (worldWidth - 297.75) / 2, artY: (fullHeight - 419.25) / 2 };
}
const defaultLayout = frameLayout(535, 753.3);
const popperScale = 1.36;
function popperY(layout: Layout) {
  return Math.min(layout.openingHeight - 78, layout.artY + 211);
}
function sourcePoint(layout: Layout) {
  return { x: layout.width / 2 - 8.4 * popperScale, y: popperY(layout) - 25.7 * popperScale };
}

export type Piece = {
  id: number;
  delay: number;
  vx: number;
  vy: number;
  gravity: number;
  phase: number;
  spin: number;
  size: number;
  color: string;
  length: number;
  width: number;
  kind: number;
  tilt: number;
};
function launch(i: number, ribbon = false): Piece {
  return {
    id: i,
    delay: rand() * 0.22,
    vx: (rand() - 0.5) * (ribbon ? 245 : 315),
    vy: -(ribbon ? 164 : 150) - rand() * 112,
    gravity: 95 + rand() * 31,
    phase: rand() * TAU,
    spin: (rand() - 0.5) * 440,
    size: 1.5 + rand() * 2.3,
    color: rand() > 0.8 ? PINK : INK,
    length: 38 + rand() * 60,
    width: 0.85 + rand() * 1.1,
    kind: i % 4,
    tilt: rand() * 120,
  };
}
export const particles = Array.from({ length: 156 }, (_, i) => launch(i));
export const ribbons = Array.from({ length: 23 }, (_, i) => launch(i, true));
export const stars = Array.from({ length: 34 }, (_, i) => launch(i + 200));
export { INK as PIECE_INK };

function position(item: Piece, time: number, layout = defaultLayout) {
  const t = Math.max(0, time - item.delay);
  const drag = 0.38,
    decay = Math.exp(-drag * t),
    travel = (1 - decay) / drag;
  const origin = sourcePoint(layout),
    spread = Math.max(1, layout.width / 297.75),
    vertical = Math.max(1, layout.fullHeight / 419.25);
  return {
    t,
    x: origin.x + item.vx * travel * spread + Math.sin(t * 3.1 + item.phase) * Math.min(t * 2, 7),
    y: origin.y + (item.vy * travel + (item.gravity / drag) * (t - travel)) * vertical,
  };
}

function ribbonPath(item: Piece, time: number, layout = defaultLayout) {
  const p = position(item, time, layout);
  const apex = Math.log(1 + (Math.abs(item.vy) * 0.38) / item.gravity) / 0.38;
  const turn = smooth((p.t - apex + 0.55) / 1.1);
  const first = Math.atan2(item.vy, item.vx);
  const lastAngle = Math.atan2(180, item.vx * 0.35) - (item.vx < 0 ? TAU : 0);
  const direction = first + (lastAngle - first) * turn;
  const dx = Math.cos(direction),
    dy = Math.sin(direction);
  const unfurl = ease(p.t / 0.45),
    length = item.length * unfurl;
  const points: { x: number; y: number }[] = [];
  for (let j = 0; j <= 18; j++) {
    const q = j / 18;
    const curl = Math.sin(q * 10.2 - p.t * 5.3 + item.phase) * (4 + q * 8) * unfurl;
    const drift = Math.sin(q * 5 + p.t * 2.7 + item.phase) * q * 4;
    points.push({ x: p.x - dx * length * q + -dy * curl + drift, y: p.y - dy * length * q + dx * curl + Math.sin(q * 6.8 + p.t * 3.4) * q * 3 });
  }
  let d = `M ${fmt(points[0]!.x)} ${fmt(points[0]!.y)}`;
  for (let j = 1; j < points.length - 1; j++) {
    const a = points[j]!,
      n = points[j + 1]!;
    d += ` Q ${fmt(a.x)} ${fmt(a.y)} ${fmt((a.x + n.x) / 2)} ${fmt((a.y + n.y) / 2)}`;
  }
  const last = points.at(-1)!;
  return d + ` L ${fmt(last.x)} ${fmt(last.y)}`;
}

function twinkleAngle(time: number, index: number, candle = false) {
  // Integer frame selection is intentional: angles jump, never interpolate.
  const frame = Math.floor(time / (candle ? 0.24 : 0.39) + index * 1.7);
  return angleFrames[((frame % angleFrames.length) + angleFrames.length) % angleFrames.length]! * (candle ? 0.9 : 0.7);
}
const sparkCentres = [
  [149.02, 81.31],
  [134.99, 75.27],
  [159.97, 81.96],
  [164.95, 95.23],
  [162.56, 84.35],
  [163.87, 98.68],
  [134.17, 93.6],
] as const;
const starCentres = {
  r: [
    [216.92, 95.09],
    [232.25, 121.13],
    [230.65, 77.19],
    [199.1, 114.13],
  ],
  l: [
    [72.13, 95.09],
    [56.8, 121.13],
    [58.4, 77.19],
    [89.95, 114.13],
  ],
} as const;
/** [layer, start, duration, clip y, clip height]: the poster's lettering, one line after another. */
const textPhases = [
  ['eyebrow', 0.95, 0.57, 199, 18],
  ['name', 1.12, 0.86, 218, 74],
  ['birthday', 1.5, 0.74, 283, 38],
  ['details', 1.9, 0.76, 330, 42],
  ['dress', 2.2, 0.65, 374, 17],
] as const;

export type SceneState = Record<string, Record<string, string | number>>;
export type SceneOptions = { idle?: boolean; reduced?: boolean; frozen?: boolean; twinkleOnly?: boolean; layout?: Layout };

export function sceneState(time: number, { idle = false, reduced = false, frozen = false, twinkleOnly = false, layout = defaultLayout }: SceneOptions = {}): SceneState {
  const t = idle ? 0 : reduced ? DURATION : Math.max(0, time);
  const state: SceneState = {};
  const set = (id: string, attrs: Record<string, string | number>) => {
    state[id] = attrs;
  };
  const expansion = idle ? 0 : smooth((t - 0.08) / 0.8);
  const h = layout.openingHeight + (layout.fullHeight - layout.openingHeight) * expansion,
    w = layout.width;
  set('birthday-scene', { viewBox: `0 0 ${fmt(w)} ${fmt(h)}` });
  set('scene-background', { width: fmt(w), height: fmt(h) });
  set('invitation-art', { transform: `translate(${fmt(layout.artX)} ${fmt(layout.artY)})` });
  set('frame-bow-left', { transform: `translate(-.8 -8)` });
  set('frame-bow-centre', { transform: `translate(${fmt(w / 2 - 148.8)} -6)` });
  set('frame-bow-right', { transform: `translate(${fmt(w - 297)} -8)` });
  set('frame-bow-bottom-left', { transform: `translate(-5 ${fmt(h - 333)})` });
  set('frame-bow-bottom-right', { transform: `translate(${fmt(w - 292)} ${fmt(h - 333)})` });
  set('frame-top-left', { d: `M 52 32 C 78 58 ${fmt(w / 2 - 60)} 56 ${fmt(w / 2 - 42)} 34 C ${fmt(w / 2 - 33)} 24 ${fmt(w / 2 - 20)} 38 ${fmt(w / 2)} 29` });
  set('frame-top-right', { d: `M ${fmt(w / 2)} 29 C ${fmt(w / 2 + 20)} 38 ${fmt(w / 2 + 33)} 24 ${fmt(w / 2 + 42)} 34 C ${fmt(w / 2 + 60)} 56 ${fmt(w - 78)} 58 ${fmt(w - 52)} 32` });
  function tail(right: boolean) {
    const mirror = (x: number) => (right ? w - x : x);
    let d = `M ${fmt(mirror(52))} 32 C ${fmt(mirror(47))} 48 ${fmt(mirror(20))} 43 ${fmt(mirror(22))} 64`;
    const span = Math.max(50, h - 118);
    for (let j = 0; j < 4; j++) {
      const y0 = 64 + (span * j) / 4,
        y1 = 64 + (span * (j + 1)) / 4;
      d += ` C ${fmt(mirror(j % 2 ? 34 : 10))} ${fmt(y0 + (y1 - y0) * 0.4)} ${fmt(mirror(j % 2 ? 8 : 35))} ${fmt(y0 + (y1 - y0) * 0.6)} ${fmt(mirror(22))} ${fmt(y1)}`;
    }
    return d + ` Q ${fmt(mirror(19))} ${fmt(h - 46)} ${fmt(mirror(31))} ${fmt(h - 47)}`;
  }
  set('frame-left-tail', { d: tail(false) });
  set('frame-right-tail', { d: tail(true) });
  const cake = idle ? 0 : clamp((t - 0.26) / 0.62);
  const cakeScale = cake >= 1 ? 1 : 1 - 0.18 * Math.exp(-8 * cake) * Math.cos(9 * cake);
  set('layer-cake', { opacity: idle ? 0 : fmt(smooth((t - 0.26) / 0.15)), transform: `translate(148 134) scale(${fmt(cakeScale)}) translate(-148 -134)` });
  set('clip-cake', { height: 121, y: 68 });
  for (const [id, start, duration, y, height] of textPhases) {
    const u = idle ? 0 : ease((t - start) / duration);
    set('layer-' + id, { opacity: fmt(smooth(u)), transform: `translate(0 ${fmt((1 - u) * 2)})` });
    set('clip-' + id, { y, height });
  }
  set('paper-decor', { opacity: 1 });
  const popY = popperY(layout);
  set('idle-trimmings', { opacity: idle ? 1 : fmt(1 - ease(t / 0.55)), transform: `translate(${fmt(w / 2 - 149)} ${fmt(popY - 219)})` });
  const recoil = Math.sin(clamp(t / 0.4) * Math.PI) * 8;
  set('party-popper', {
    opacity: idle ? 1 : fmt(1 - smooth((t - 0.12) / 0.65)),
    transform: `translate(${fmt(w / 2 + recoil * 0.2)} ${fmt(popY + recoil)}) rotate(${fmt(-18 + recoil * 0.5)}) scale(${fmt(popperScale * (idle ? 1 : 1 - recoil * 0.008))})`,
  });
  set('original-stars', { opacity: idle ? 0 : fmt(smooth((t - 0.8) / 0.8)) });
  set('scene-sparkles-lower', { opacity: idle ? 0 : fmt(smooth((t - 0.88) / 0.4)) });
  const tickTime = frozen || reduced ? 0 : t;
  for (const side of ['r', 'l'] as const)
    starCentres[side].forEach(([x, y], i) => {
      const n = i + (side === 'l' ? 4 : 0);
      const frame = Math.floor(tickTime / 0.39 + n * 1.7);
      const pulse = ((frame % 5) + 5) % 5;
      const scale = frozen || reduced ? 1 : [1, 0.94, 1.14, 1, 1.08][pulse]!;
      set(`star-${side}-${i}`, {
        transform: `translate(${x} ${y}) rotate(${fmt(twinkleAngle(tickTime, n))}) scale(${scale}) translate(${-x} ${-y})`,
        opacity: frozen || reduced ? 1 : [1, 0.58, 1, 0.76, 1][pulse]!,
      });
    });
  sparkCentres.forEach(([x, y], i) =>
    set('candle-spark-' + i, {
      transform: `rotate(${fmt(twinkleAngle(tickTime, i, true))} ${x} ${y})`,
      opacity: frozen || reduced ? 1 : [1, 0.78, 1, 0.88][(((Math.floor(tickTime / 0.24 + i) % 4) + 4) % 4)]!,
    }),
  );
  if (twinkleOnly) return Object.fromEntries(Object.entries(state).filter(([id]) => id.startsWith('star-') || id.startsWith('candle-spark-')));
  for (const [collection, prefix] of [
    [particles, 'confetti'],
    [ribbons, 'ribbon'],
    [stars, 'flying-star'],
  ] as const) {
    for (const item of collection) {
      const p = position(item, t, layout),
        active = !idle && !reduced && t > item.delay && t < DURATION && p.y < layout.fullHeight + 100;
      const alpha = active ? smooth(p.t / 0.07) * (1 - smooth((t - 5.25) / 0.55)) : 0;
      if (prefix === 'ribbon') set(`${prefix}-${item.id}`, { d: ribbonPath(item, t, layout), opacity: fmt(alpha * 0.92) });
      else if (prefix === 'flying-star') {
        const angle = twinkleAngle(t, item.id) * 2.4 + item.tilt;
        const pulse = [1, 0.55, 1, 0.8][(((Math.floor(t / 0.2 + item.id) % 4) + 4) % 4)]!;
        set(`${prefix}-${item.id}`, { transform: `translate(${fmt(p.x)} ${fmt(p.y)}) rotate(${fmt(angle)}) scale(${fmt(item.size * 0.84)})`, opacity: fmt(alpha * pulse) });
      } else {
        const flip = Math.max(0.17, Math.abs(Math.cos(p.t * 5 + item.phase)));
        set(`${prefix}-${item.id}`, { transform: `translate(${fmt(p.x)} ${fmt(p.y)}) rotate(${fmt(item.tilt + p.t * item.spin)}) scale(${fmt(flip)} 1)`, opacity: fmt(alpha) });
      }
    }
  }
  return state;
}

/** Applies a scene state to the poster's elements (found by id without the instance prefix), only what changed. */
export function createRenderer(svg: SVGSVGElement, prefix: string) {
  const nodes = new Map<string, Element>([...svg.querySelectorAll('[id]')].map((n) => [n.id.slice(prefix.length), n]));
  nodes.set(svg.id.slice(prefix.length), svg);
  const applied = new Map<string, string>();
  return (time: number, options: SceneOptions = {}) => {
    const state = sceneState(time, options);
    for (const [id, attrs] of Object.entries(state)) {
      const n = nodes.get(id);
      if (!n) continue;
      for (const [k, v] of Object.entries(attrs)) {
        const text = String(v),
          key = id + ':' + k;
        if (applied.get(key) !== text) {
          n.setAttribute(k, text);
          applied.set(key, text);
        }
      }
    }
    return state;
  };
}

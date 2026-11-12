/*
 * The poster's opening, from the designer's motion.js: one deterministic scene. `sceneState(time)` gives every
 * animated element's attributes at that moment (ids without the instance prefix); the theme applies them to the
 * inline poster each frame. 156 confetti pieces, 23 ribbons and 34 stars burst from the party popper while the cake,
 * the «Birthday» calligraphy and the lettering settle in; then only the pink stars twinkle.
 */
export const DURATION = 5.8;
/** The lettering is in place by then; the website opens below while the last confetti falls. */
export const SETTLED = 3;
const INK = '#920d25';
const PINK = '#ebaaa9';
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
  return Math.min(layout.openingHeight * 0.58, layout.artY + 245);
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
    width: 0.35 + rand() * 0.6,
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
const starCentres = [
  [53.66, 158.887],
  [63.276, 164.784],
  [64.172, 145.484],
  [48.039, 146.059],
  [58.289, 152.123],
  [232.041, 234.346],
  [241.657, 240.241],
  [242.551, 220.942],
  [226.418, 221.518],
  [236.667, 227.58],
  [225.608, 78.774],
  [232.535, 83.023],
  [233.035, 69.119],
  [221.558, 69.535],
  [228.942, 73.9],
  [57.339, 339.225],
  [64.267, 343.473],
  [64.77, 329.568],
  [53.289, 329.984],
  [60.672, 334.352],
] as const;
/** [layer, start, duration]: the poster's calligraphy and lettering, one after another. */
const textPhases = [
  ['birthday', 0.75, 0.65],
  ['eyebrow', 1.02, 0.5],
  ['name', 1.25, 0.8],
  ['details', 1.9, 0.7],
  ['dress', 2.2, 0.6],
  ['mini-cakes', 0.65, 0.65],
] as const;

export type SceneState = Record<string, Record<string, string | number>>;
export type SceneOptions = { idle?: boolean; reduced?: boolean; frozen?: boolean; twinkleOnly?: boolean; layout?: Layout };

export function sceneState(time: number, { idle = false, reduced = false, frozen = false, twinkleOnly = false, layout = defaultLayout }: SceneOptions = {}): SceneState {
  const t = idle ? 0 : reduced ? DURATION : Math.max(0, time);
  const state: SceneState = {};
  const set = (id: string, attrs: Record<string, string | number>) => {
    state[id] = attrs;
  };
  const h = layout.openingHeight + (layout.fullHeight - layout.openingHeight) * (idle ? 0 : smooth((t - 0.08) / 0.8)),
    w = layout.width;
  set('birthday-scene', { viewBox: `0 0 ${fmt(w)} ${fmt(h)}` });
  set('scene-background', { width: fmt(w), height: fmt(h) });
  set('paper-texture', { transform: `scale(${fmt(w / 297.75)} ${fmt(h / 419.25)})` });
  set('invitation-art', { transform: `translate(${fmt(layout.artX)} ${fmt(layout.artY)})` });
  set('frame-top-left', { transform: 'translate(0 -12)' });
  set('frame-top-right', { transform: `translate(${fmt(w - 297.75)} -12)` });
  set('frame-bottom-left', { transform: `translate(0 ${fmt(h - 407)})` });
  set('frame-bottom-right', { transform: `translate(${fmt(w - 297.75)} ${fmt(h - 407)})` });
  const ribbon = (right: boolean) => {
    const x = (n: number) => fmt(right ? w - n : n),
      span = h - 202;
    return `M${x(27)} 100 C${x(14)} ${fmt(100 + span * 0.33)} ${x(39)} ${fmt(100 + span * 0.63)} ${x(27)} ${fmt(h - 102)} L${x(28.4)} ${fmt(h - 102)} C${x(43)} ${fmt(100 + span * 0.63)} ${x(17)} ${fmt(100 + span * 0.33)} ${x(27)} 100 Z`;
  };
  set('frame-left-tail', { d: ribbon(false) });
  set('frame-right-tail', { d: ribbon(true) });
  const u = idle ? 0 : clamp((t - 0.26) / 0.62),
    scale = u >= 1 ? 1 : 1 - 0.16 * Math.exp(-8 * u) * Math.cos(9 * u);
  set('layer-cake', { opacity: idle ? 0 : fmt(smooth((t - 0.26) / 0.16)), transform: `translate(148.5 189.5) scale(${fmt(scale)}) translate(-148.5 -189.5)` });
  for (const [id, start, duration] of textPhases) {
    const q = idle ? 0 : ease((t - start) / duration);
    set('layer-' + id, { opacity: fmt(smooth(q)), transform: `translate(0 ${fmt((1 - q) * 2)})` });
  }
  const popY = popperY(layout),
    recoil = Math.sin(clamp(t / 0.4) * Math.PI) * 8;
  set('paper-decor', { opacity: 1 });
  set('idle-trimmings', { opacity: idle ? 1 : fmt(1 - ease(t / 0.55)), transform: `translate(${fmt(w / 2 - 149)} ${fmt(popY - 219)})` });
  set('party-popper', {
    opacity: idle ? 1 : fmt(1 - smooth((t - 0.12) / 0.65)),
    transform: `translate(${fmt(w / 2 + recoil * 0.2)} ${fmt(popY + recoil)}) rotate(${fmt(-18 + recoil * 0.5)}) scale(${fmt(popperScale * (idle ? 1 : 1 - recoil * 0.008))})`,
  });
  set('original-stars', { opacity: idle ? 0 : fmt(smooth((t - 0.7) / 0.65)) });
  set('scene-sparkles', { opacity: idle ? 0 : fmt(smooth((t - 0.88) / 0.4)) });
  const tickTime = frozen || reduced ? 0 : t;
  starCentres.forEach(([x, y], i) => {
    const frame = Math.floor(tickTime / 0.39 + i * 1.7),
      q = ((frame % 5) + 5) % 5,
      sc = frozen || reduced ? 1 : [1, 0.94, 1.12, 1, 1.06][q]!;
    set('star-pink-' + i, {
      transform: `translate(${x} ${y}) rotate(${fmt(twinkleAngle(tickTime, i))}) scale(${sc}) translate(${-x} ${-y})`,
      opacity: frozen || reduced ? 1 : [1, 0.6, 1, 0.78, 1][q]!,
    });
  });
  if (twinkleOnly) return Object.fromEntries(Object.entries(state).filter(([id]) => id.startsWith('star-pink-')));
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

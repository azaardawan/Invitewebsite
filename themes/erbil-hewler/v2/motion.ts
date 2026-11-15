/**
 * The opening, from the designer's app.js: one journey through Erbil, through the citadel gate, past the Citadel, through
 * Shar Square and the Choli Minaret to the arched card with the couple's names. As the designer made it, the guest's
 * scroll plays it (after Open), over the designer's own track: 4.6 screens tall, 6.2 on a phone. `sceneAt(p)` gives
 * every layer's transform and opacity at progress p (0–1); the theme writes them on animation frames.
 */
/** How quickly the drawing catches up with the scroll (ms): small enough to follow, large enough to glide. */
export const FOLLOW_MS = 110;

const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const phase = (p: number, a: number, b: number) => {
  const t = clamp((p - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export type Layer =
  | 'gate'
  | 'names'
  | 'cue'
  | 'distantCitadel'
  | 'citadelWorld'
  | 'citadelHill'
  | 'citadelIntro'
  | 'cloudOne'
  | 'cloudTwo'
  | 'warmth'
  | 'cityWorld'
  | 'citySquare'
  | 'cityMinaret'
  | 'cityCaption'
  | 'mapBackdrop'
  | 'revealCard'
  | 'foliageLeft'
  | 'foliageRight';

export type Scene = Partial<Record<Layer, { transform?: string; opacity?: number }>>;

/**
 * Every layer at progress `p` on a `w` × `h` stage; `gateOriginY` is where the gate's arch is (the camera flies
 * through it).
 */
export function sceneAt(p: number, w: number, h: number, gateOriginY: number): Scene {
  const approach = phase(p, 0.015, 0.235);
  const scale = 1 / (1 - 0.91 * approach);
  const title = phase(p, 0.02, 0.12);
  const citadelEnter = phase(p, 0.07, 0.24),
    citadelLeave = phase(p, 0.42, 0.56);
  const pass = phase(p, 0.56, 0.82);
  const emerge = phase(p, 0.73, 0.85),
    open = phase(p, 0.8, 0.97);
  const grow = phase(p, 0.66, 0.79);
  const foliage = (sign: number) => ({
    opacity: grow * (1 - 0.28 * open),
    transform: `translate3d(${sign * w * 0.43 * open}px,${h * 0.48 * (1 - grow) + h * 0.16 * open}px,0) rotate(${sign * 23 * open}deg) scale(${0.85 + 0.25 * grow})`,
  });
  return {
    gate: {
      transform: `translate3d(0,${(h * 0.51 - gateOriginY) * approach}px,0) scale(${scale})`,
      opacity: 1 - phase(p, 0.225, 0.265),
    },
    names: {
      transform: `translate3d(0,${-h * 0.25 * title}px,0) scale(${1 + 0.12 * title})`,
      opacity: 1 - title,
    },
    cue: { opacity: 1 - phase(p, 0, 0.07) },
    cloudOne: {
      transform: `translate3d(${-w * 0.35 * approach}px,${-h * 0.1 * approach}px,0) scale(${1 + 0.6 * approach})`,
    },
    cloudTwo: {
      transform: `translate3d(${w * 0.35 * approach}px,${-h * 0.06 * approach}px,0) scale(${1 + 0.45 * approach})`,
    },
    distantCitadel: {
      opacity: 0.6 * (1 - phase(p, 0.04, 0.26)),
      transform: `translate3d(0,${h * 0.18 * approach}px,0) scale(${1 + 0.8 * approach})`,
    },
    warmth: { opacity: phase(p, 0.1, 0.25) },
    citadelWorld: { opacity: citadelEnter * (1 - phase(p, 0.47, 0.56)) },
    citadelHill: {
      transform: `translate3d(${-w * 0.22 * citadelLeave}px,${h * 0.18 * citadelLeave}px,0) scale(${0.82 + 0.18 * citadelEnter + 0.2 * citadelLeave})`,
    },
    citadelIntro: {
      opacity: phase(p, 0.22, 0.29) * (1 - phase(p, 0.42, 0.48)),
      transform: `translate3d(0,${-h * 0.12 * citadelLeave}px,0)`,
    },
    cityWorld: { opacity: phase(p, 0.45, 0.54) * (1 - phase(p, 0.77, 0.85)) },
    citySquare: {
      transform: `translate3d(${-w * 0.49 * pass}px,${h * 0.18 * pass}px,0) scale(${1 + 0.8 * pass})`,
    },
    cityMinaret: {
      transform: `translate3d(${w * 0.4 * pass}px,${h * 0.1 * pass}px,0) scale(${1 + 0.65 * pass})`,
    },
    cityCaption: {
      opacity: phase(p, 0.51, 0.58) * (1 - phase(p, 0.67, 0.73)),
      transform: `translate3d(0,${-h * 0.13 * pass}px,0)`,
    },
    mapBackdrop: {
      opacity: phase(p, 0.25, 0.43),
      transform: `scale(${1.2 - 0.2 * phase(p, 0.33, 0.93)})`,
    },
    revealCard: {
      opacity: emerge,
      transform: `translate3d(0,${h * 0.16 * (1 - emerge)}px,0) scale(${0.78 + 0.22 * emerge})`,
    },
    foliageLeft: foliage(-1),
    foliageRight: foliage(1),
  };
}

/** The sun of the design's sandstone ornaments and the printed poster: a 21-ray star as polygon points. */
export function sunPoints(cx: number, cy: number, inner: number, outer: number, count = 21) {
  let points = '';
  for (let i = 0; i < count * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / count,
      r = i % 2 ? inner : outer;
    points += `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)} `;
  }
  return points.trim();
}

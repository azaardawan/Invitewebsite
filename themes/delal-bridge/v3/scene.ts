import { BASE, GROUPS, LAYERS, T_SWITCH, type Key, type Layer } from './layout';

/**
 * Draws the opening on a canvas at clock `t` (0 → 4, see layout.ts): the sky, clouds, mountains, the Khabur and Delal
 * Bridge (the camera flies through its arch), the pomegranate trees closing in, a continuous fall of leaves that covers
 * the screen while the scene changes, then the Kurdish gateway with the card. Deterministic in `t`, so the same frame
 * always looks the same.
 */

export type SceneImages = Record<string, HTMLImageElement>;
export type CardBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const ease = (u: number) => u * u * (3 - 2 * u);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * The value of a track at `t`: a smooth curve through its keys (monotone cubic, so it never overshoots and a held
 * value stays still), at rest at the first and last key. Moving through the keys keeps its speed, so the flight
 * glides instead of slowing at every key.
 */
function val(keys: readonly Key[], t: number): number[] {
  const first = keys[0]!;
  if (keys.length === 1 || t <= first[0]) return first.slice(1);
  const last = keys[keys.length - 1]!;
  if (t >= last[0]) return last.slice(1);
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1]![0]) i++;
  const a = keys[i]!;
  const b = keys[i + 1]!;
  const h = b[0] - a[0];
  const u = (t - a[0]) / h;
  const out: number[] = [];
  for (let j = 1; j < a.length; j++) {
    const m0 = slope(keys, i, j);
    const m1 = slope(keys, i + 1, j);
    const u2 = u * u;
    const u3 = u2 * u;
    out.push((2 * u3 - 3 * u2 + 1) * a[j]! + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * b[j]! + (u3 - u2) * h * m1);
  }
  return out;
}

/** The curve's slope at key `i` for component `j` (Fritsch–Carlson): 0 at the ends, at a turn and on a hold. */
function slope(keys: readonly Key[], i: number, j: number): number {
  if (i === 0 || i === keys.length - 1) return 0;
  const p = keys[i - 1]!;
  const k = keys[i]!;
  const n = keys[i + 1]!;
  const d0 = (k[j]! - p[j]!) / (k[0] - p[0]);
  const d1 = (n[j]! - k[j]!) / (n[0] - k[0]);
  if (d0 === 0 || d1 === 0 || Math.sign(d0) !== Math.sign(d1)) return 0;
  const w1 = 2 * (n[0] - k[0]) + (k[0] - p[0]);
  const w2 = (n[0] - k[0]) + 2 * (k[0] - p[0]);
  return (w1 + w2) / (w1 / d0 + w2 / d1);
}

function groupOpacity(group: Layer['group'], t: number): number {
  const ks = GROUPS[group];
  if (!ks) return 1;
  return (
    val(
      ks.map(([kt, v]) => [kt, v, 0, 0, 0, 0] as const),
      t,
    )[0]! / 100
  );
}

const LEAF_FILES = ['leaf-1', 'leaf-2', 'leaf-3', 'leaf-4', 'leaf-5'];

/** Loose leaves drifting down while the trees close (before the wall of leaves). */
const DRIFT = Array.from({ length: 40 }, (_, i) => {
  const start = 1.6 + rnd(i, 1) * 0.5;
  return {
    img: i % 5,
    start,
    dur: Math.min(0.4 + rnd(i, 2) * 0.3, 2.32 - start),
    x0: rnd(i, 3),
    drift: (rnd(i, 4) - 0.5) * 0.5,
    sway: 0.02 + rnd(i, 5) * 0.05,
    freq: 2 + rnd(i, 6) * 3,
    size: 0.08 + rnd(i, 7) * 0.08,
    rot0: rnd(i, 8) * 360,
    spin: (rnd(i, 9) - 0.5) * 900,
  };
});

type CurtainLeaf = {
  img: number;
  gx: number;
  gy: number;
  v: number;
  size: number;
  rot: number;
  spin: number;
  sway: number;
  freq: number;
  ph: number;
};

export class Scene {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private curtain: CurtainLeaf[] = [];
  private curtainKey = '';
  private shadows = new Map<string, { c: HTMLCanvasElement; pad: number; dx: number; dy: number }>();
  private haze: HTMLCanvasElement;

  constructor(
    private canvas: HTMLCanvasElement,
    private images: SceneImages,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.haze = document.createElement('canvas');
    this.haze.width = 1200;
    this.haze.height = 100;
    const x = this.haze.getContext('2d')!;
    const g = x.createLinearGradient(0, 0, 0, 100);
    g.addColorStop(0, 'rgba(235,244,250,0)');
    g.addColorStop(0.5, 'rgba(235,244,250,.55)');
    g.addColorStop(1, 'rgba(235,244,250,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 1200, 100);
  }

  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  }

  /** Where the artboard sits on this screen. Phones draw the landscape larger, on the bottom edge, lifted under the names. */
  private view(t: number, namesBottom: number) {
    const { w: W, h: H } = this;
    const portrait = W / H < 1.15;
    const s = portrait ? W / 1150 : Math.max(W / 1920, H / 1080);
    const sw = portrait ? W / 820 : s;
    const lift0 = portrait ? Math.max(0, H - (1080 - 755) * sw - (namesBottom + H * 0.05)) : 0;
    const lift = lift0 * (1 - ease(clamp(t / 1.1, 0, 1)));
    return {
      portrait,
      s,
      sw,
      lift,
      ox: W / 2 - 960 * s,
      oyC: H / 2 - 540 * s,
      oxW: W / 2 - 960 * sw,
      oyW: portrait ? H - 1080 * sw - lift : H / 2 - 540 * s,
      g: portrait ? Math.max(1, H / s / 1080) : 1,
      extraSky: portrait ? H / sw - 1080 : 0,
    };
  }

  /** The card's box on screen at `t` (for the live text laid over it). */
  cardBox(t: number): CardBox {
    const v = this.view(t, 0);
    const cp = LAYERS.find((l) => l.n === 'card_paper')!;
    const [x, y, sc] = val(v.portrait && cp.pkeys ? cp.pkeys : cp.keys, t) as [number, number, number];
    const [bw, bh] = BASE['card-paper']!;
    const width = ((bw * sc) / 100) * v.s;
    const height = ((bh * sc) / 100) * v.s;
    return {
      left: v.ox + x * v.s - width / 2,
      top: v.oyC + y * v.s - height / 2,
      width,
      height,
    };
  }

  draw(t: number, namesBottom: number) {
    const { ctx, w: W, h: H } = this;
    if (!W || !H) return;
    const v = this.view(t, namesBottom);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    const sky = this.images.sky;
    if (sky) {
      const ss = Math.max(W / sky.width, H / sky.height);
      ctx.drawImage(sky, (W - sky.width * ss) / 2, (H - sky.height * ss) / 2, sky.width * ss, sky.height * ss);
    }
    let foreDone = false;
    for (const l of LAYERS) {
      if (!foreDone && l.group !== 'world') {
        foreDone = true;
        this.drawRiver(v.lift);
      }
      const [x0, y0, sc, op0, rot] = val(v.portrait && l.pkeys ? l.pkeys : l.keys, t) as [number, number, number, number, number];
      const x = x0;
      let y = y0;
      const op = (op0 / 100) * groupOpacity(l.group, t);
      if (op < 0.005 || sc <= 0.1) continue;
      let X: number, Y: number, k: number;
      if (l.group === 'trees') {
        X = W / 2 + (x - 960) * v.s * v.g;
        Y = H / 2 + (y - 540) * v.s * v.g;
        k = v.s * v.g;
      } else if (l.group === 'invite') {
        X = v.ox + x * v.s;
        Y = v.oyC + y * v.s;
        k = v.s;
      } else {
        if (l.n.startsWith('cloud')) y -= v.extraSky * 0.42;
        X = v.oxW + x * v.sw;
        Y = v.oyW + y * v.sw;
        k = v.sw;
      }
      ctx.globalAlpha = op;
      if (l.kind === 'wall') {
        ctx.fillStyle = '#f8eedc';
        ctx.fillRect(0, 0, W, H);
        const gr = ctx.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.2, W / 2, H * 0.42, Math.max(W, H) * 0.8);
        gr.addColorStop(0, 'rgba(255,250,238,.7)');
        gr.addColorStop(1, 'rgba(214,190,150,.35)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, W, H);
        continue;
      }
      if (l.kind === 'haze') {
        const hw = ((2400 * sc) / 100) * k;
        const hh = ((200 * sc) / 100) * k;
        ctx.drawImage(this.haze, X - hw / 2, Y - hh / 2, hw, hh);
        continue;
      }
      const img = l.file ? this.images[l.file] : undefined;
      const base = l.file ? BASE[l.file] : undefined;
      if (!img || !base) continue;
      const w = ((base[0] * sc) / 100) * k;
      const h = ((base[1] * sc) / 100) * k;
      if (X + w / 2 < 0 || X - w / 2 > W || Y + h / 2 < 0 || Y - h / 2 > H) continue;
      ctx.save();
      ctx.translate(X, Y);
      if (rot) ctx.rotate((rot * Math.PI) / 180);
      if (l.flip) ctx.scale(-1, 1);
      const sh = this.shadowFor(l, img, base);
      if (sh) {
        const f = w / base[0];
        const pw = (base[0] + sh.pad * 2) * f;
        const ph = (base[1] + sh.pad * 2) * f;
        ctx.drawImage(sh.c, -pw / 2 + sh.dx * k, -ph / 2 + sh.dy * k, pw, ph);
      }
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    this.drawLeaves(t);
    ctx.globalAlpha = 1;
  }

  /** Phones: the Khabur in the foreground under the lifted landscape, mirroring the bridge and the sky. */
  private drawRiver(h: number) {
    const { ctx, w: W, h: H, dpr } = this;
    if (h <= 1) return;
    const shore = H - h;
    const src = Math.min(h, shore);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#2b8fa6';
    ctx.fillRect(0, shore, W, h + 1);
    ctx.translate(0, shore);
    ctx.scale(1, -0.92);
    ctx.globalAlpha = 0.85;
    ctx.drawImage(this.canvas, 0, Math.max(0, (shore - h) * dpr), W * dpr, src * dpr, 0, -src, W, src);
    ctx.restore();
    const gr = ctx.createLinearGradient(0, shore, 0, H);
    gr.addColorStop(0, 'rgba(120,205,215,.35)');
    gr.addColorStop(0.5, 'rgba(40,140,165,.45)');
    gr.addColorStop(1, 'rgba(18,90,115,.7)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, shore, W, h + 1);
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 26; i++) {
      const yy = shore + 6 + (((i * 37) % 100) / 100) * (h - 10);
      const xx = (((i * 113) % 100) / 100) * W;
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx + 14 + ((i * 29) % 46), yy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private shadowFor(l: Layer, img: HTMLImageElement, base: readonly [number, number]) {
    if (!l.shadow) return null;
    const hit = this.shadows.get(l.n);
    if (hit) return hit;
    const [dx, dy, bl, al] = l.shadow;
    const q = 0.25;
    const sc = l.keys[0]![3] / 100;
    const blur = Math.max(2, (bl * q) / sc);
    const padPx = Math.ceil(blur * 2.5);
    const w = Math.ceil(base[0] * q);
    const h = Math.ceil(base[1] * q);
    const c = document.createElement('canvas');
    c.width = w + padPx * 2;
    c.height = h + padPx * 2;
    const x = c.getContext('2d')!;
    x.shadowColor = `rgba(40,25,10,${al})`;
    x.shadowBlur = blur;
    x.shadowOffsetX = 5000;
    x.drawImage(img, padPx - 5000, padPx, w, h);
    const out = { c, pad: padPx / q, dx, dy };
    this.shadows.set(l.n, out);
    return out;
  }

  private buildCurtain() {
    const { w: W, h: H } = this;
    const big = Math.max(W, H);
    const cell = big * 0.14;
    const cols = Math.ceil(W / cell) + 1;
    const top = -0.35 * H;
    const rows = Math.ceil((1.25 * H - top) / cell) + 1;
    const out: CurtainLeaf[] = [];
    let i = 0;
    for (let layer = 0; layer < 2; layer++)
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++, i++)
          out.push({
            img: i % 5,
            gx: (c + (layer ? 0.5 : 0) + (rnd(i, 1) - 0.5) * 0.5) * cell,
            gy: top + (r + (layer ? 0.5 : 0) + (rnd(i, 2) - 0.5) * 0.5) * cell,
            v: H * 3.9 * (0.88 + rnd(i, 3) * 0.24),
            size: cell * (2.1 + rnd(i, 4) * 0.8),
            rot: rnd(i, 5) * 360,
            spin: (rnd(i, 6) - 0.5) * 420,
            sway: (rnd(i, 7) - 0.5) * cell * 1.1,
            freq: 3 + rnd(i, 8) * 4,
            ph: rnd(i, 9) * 6.28,
          });
    this.curtain = out;
    this.curtainKey = `${W}x${H}`;
  }

  private leaf(img: HTMLImageElement, x: number, y: number, w: number, rot: number, sx: number) {
    const { ctx } = this;
    const h = (w * img.height) / img.width;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rot * Math.PI) / 180);
    if (sx !== 1) ctx.scale(sx, 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  /** The drifting leaves, then the wall: one continuous fall that covers the whole screen at T_SWITCH. */
  private drawLeaves(t: number) {
    const { ctx, w: W, h: H } = this;
    const big = Math.max(W, H);
    const imgs = LEAF_FILES.map((f) => this.images[f]);
    ctx.globalAlpha = 1;
    for (const L of DRIFT) {
      const u = (t - L.start) / L.dur;
      const img = imgs[L.img];
      if (u <= 0 || u >= 1 || !img) continue;
      this.leaf(
        img,
        (L.x0 + L.drift * u) * W + Math.sin(u * L.freq * Math.PI) * L.sway * W,
        -0.25 * H + u * 1.55 * H,
        L.size * big,
        L.rot0 + L.spin * u,
        Math.cos(u * L.freq * 2.1) * 0.35 + 0.65,
      );
    }
    if (t < 1.98 || t > 2.99) return;
    if (this.curtainKey !== `${W}x${H}`) this.buildCurtain();
    const back = clamp((t - (T_SWITCH - 0.06)) / 0.05, 0, 1) * (1 - clamp((t - (T_SWITCH + 0.02)) / 0.08, 0, 1));
    if (back > 0) {
      ctx.globalAlpha = back;
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, big * 0.7);
      g.addColorStop(0, '#6f9a2c');
      g.addColorStop(1, '#3f6420');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    for (const L of this.curtain) {
      const img = imgs[L.img];
      if (!img) continue;
      const dt = t - T_SWITCH;
      const y = L.gy + L.v * dt;
      if (y < -L.size || y > H + L.size) continue;
      this.leaf(img, L.gx + Math.sin(dt * L.freq + L.ph) * L.sway, y, L.size, L.rot + L.spin * dt, 1 - 0.3 * Math.sin(dt * L.freq * 1.3 + L.ph) ** 2);
    }
  }
}

/** Every picture the scene draws (by layout file name). */
export const SCENE_FILES = Array.from(new Set(['sky', ...LEAF_FILES, ...LAYERS.map((l) => l.file).filter((f): f is string => Boolean(f))]));

/**
 * The flower tunnel, from the designer's flowers.js: rings of watercolour flowers grow from the gift, turn in
 * alternate directions until they cover the screen, then fall away to show the page. The designer's timeline is
 * 8.2 s: the growing and turning (to 6.3 s) plays here in 3 s; the fall (owner, 2026-11-15: it was too fast) plays
 * slower than the designer's, about 3.2 s, the flowers drifting down and swaying as the page shows through.
 * `designTime` maps the invitation's clock onto the designer's timeline.
 */
const ORIGINAL_MS = 8200;
const ORIGINAL_FALL = 6300;
/** When the flowers start to fall (the page shows through from here). */
export const FALL_MS = 3000;
/** How long the fall lasts on screen. */
const FALL_FOR = 3200;
/** The end of the opening. */
export const BLOOM_MS = FALL_MS + FALL_FOR;
const GROW_PACE = ORIGINAL_FALL / FALL_MS;
const FALL_PACE = (ORIGINAL_MS - ORIGINAL_FALL) / FALL_FOR;
const designTime = (ms: number) => (ms < FALL_MS ? ms * GROW_PACE : ORIGINAL_FALL + (ms - FALL_MS) * FALL_PACE);

const TAU = Math.PI * 2;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const random = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};

export type Sprite = {
  x: number;
  y: number;
  size: number;
  rotation: number;
  alpha: number;
  flower: number;
};

/** Every flower at `ms` into the opening, in a `width` × `height` screen. */
export function bloomFrame(ms: number, width: number, height: number): Sprite[] {
  const time = designTime(Math.max(0, ms));
  const p = clamp(time / 6070);
  const outer = Math.hypot(width, height) * 0.57 * Math.pow(p, 0.87) + 4;
  const sprites: Sprite[] = [];
  for (let ring = 10; ring >= 0; ring--) {
    const radius = outer * Math.pow(0.76, ring),
      direction = ring % 2 ? 1 : -1;
    for (let j = 0; j < 23; j++) {
      const n = ring * 23 + j,
        angle = (j / 23) * TAU + ring * 0.19 + ((direction * Math.min(time, ORIGINAL_FALL)) / 1000) * (0.2 + ring * 0.009);
      // Seconds of the designer's fall (0–1.9): each flower lets go a little after its neighbours, drifts down
      // gently (lighter than the designer's gravity), sways and turns as it goes.
      const fall = Math.max(0, (time - ORIGINAL_FALL - random(n) * 420) / 1000);
      const sway = Math.sin(fall * 3.2 + random(n + 21) * TAU) * width * 0.035 * Math.min(1, fall * 2);
      sprites.push({
        x: width / 2 + Math.cos(angle) * radius + (random(n + 14) - 0.5) * width * 0.26 * fall + sway,
        y: height / 2 + Math.sin(angle) * radius + height * (0.12 * fall + 0.36 * fall * fall),
        size: radius * (0.392 + random(n) * 0.04),
        rotation: angle + random(n + 3) * TAU + fall * (random(n + 9) - 0.5) * 1.8,
        alpha: clamp((time - 170) / 470) * clamp((ORIGINAL_MS - time) / 260),
        flower: (j + ring * 3) % 9,
      });
    }
  }
  return sprites;
}

/**
 * Draws the tunnel on a canvas: the atlas is cut once into nine cached flower canvases (no per-frame slicing), the
 * pixel ratio is capped and flowers off the screen or too small to see are skipped, so it stays smooth on phones.
 */
export function createTunnel(canvas: HTMLCanvasElement, atlasSrc: string) {
  const ctx = canvas.getContext('2d', { alpha: true });
  let flowers: HTMLCanvasElement[] = [];
  let width = 1,
    height = 1,
    dpr = 1;
  const ready = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const cell = img.width / 3;
      flowers = Array.from({ length: 9 }, (_, i) => {
        const c = document.createElement('canvas');
        c.width = c.height = 320;
        c.getContext('2d')?.drawImage(img, (i % 3) * cell, Math.floor(i / 3) * cell, cell, cell, 0, 0, 320, 320);
        return c;
      });
      resolve();
    };
    img.onerror = reject;
    img.src = atlasSrc;
  });
  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  };
  const draw = (ms: number) => {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!flowers.length) return;
    for (const s of bloomFrame(ms, width, height)) {
      if (s.size < 2 || s.alpha <= 0 || s.y - s.size > height || s.x + s.size < 0 || s.x - s.size > width) continue;
      ctx.globalAlpha = s.alpha;
      ctx.setTransform(dpr * Math.cos(s.rotation), dpr * Math.sin(s.rotation), -dpr * Math.sin(s.rotation), dpr * Math.cos(s.rotation), dpr * s.x, dpr * s.y);
      ctx.drawImage(flowers[s.flower]!, -s.size / 2, -s.size / 2, s.size, s.size);
    }
    ctx.globalAlpha = 1;
  };
  const clear = () => ctx?.clearRect(0, 0, canvas.width, canvas.height);
  return { ready, resize, draw, clear };
}

'use client';

import { useEffect, useRef } from 'react';
import type { SealText } from './initials';
import s from './theme.module.css';

/**
 * The burgundy wax seal with the couple's initials pressed into it. The seal is the design's own wax with its rose
 * smoothed away (assets/wax-seal-blank.webp); the letters are drawn on a canvas over its flat face as raised wax, lit
 * from the upper left like the rim: a soft shadow below, a bright edge on top, a darker edge underneath. On the large
 * seal at the end of the invitation a small laurel is pressed under the letters, as on a real seal stamp.
 * `seal` null: the rose seal (the customer chose it, or there are no names yet).
 */
export function WaxSeal({ seal, laurel, className, label }: { seal: SealText | null; laurel?: boolean; className?: string; label?: string }) {
  return (
    <span className={`${s['bl-seal']} ${seal ? s['bl-seal-blank'] : ''} ${className ?? ''}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {seal ? <SealLetters seal={seal} laurel={!!laurel} /> : null}
    </span>
  );
}

/** Fallback families; the real ones follow the invitation's script (theme.module.css, --seal-script / --seal-join). */
const SCRIPT = '"BL Ceremony", "BL Serif", serif';
const TEXT = '"BL Serif", serif';
/** The joining symbol's size, relative to the letters. */
const JOIN = 0.62;
const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/;

type Piece = { kind: 'text'; text: string; font: string; rtl: boolean } | { kind: 'heart' };

function pieces(seal: SealText, script: string, text: string): { list: Piece[]; join: number } {
  if ('custom' in seal) return { list: [{ kind: 'text', text: seal.custom, font: script, rtl: RTL.test(seal.custom) }], join: -1 };
  const rtl = RTL.test(seal.first + (seal.second ?? ''));
  const letter = (t: string): Piece => ({ kind: 'text', text: t, font: script, rtl });
  const join: Piece | null = seal.join ? (seal.join === '♥' ? { kind: 'heart' } : { kind: 'text', text: seal.join, font: text, rtl: RTL.test(seal.join) }) : null;
  const order = [letter(seal.first), ...(join ? [join] : []), ...(seal.second ? [letter(seal.second)] : [])];
  // Visual order, left to right: Arabic and Kurdish read from the right, so the groom's letter is on the right.
  const list = rtl ? order.reverse() : order;
  return { list, join: join ? 1 : -1 };
}

/** The heart (24 × 21.5), drawn as a shape: the fonts have none, and phones would show a red emoji. */
const HEART = 'M12 21.5 10.3 20C4.2 14.6 0 10.9 0 6.4 0 2.8 2.8 0 6.4 0c2 0 4 .9 5.6 2.4C13.6.9 15.6 0 17.6 0 21.2 0 24 2.8 24 6.4c0 4.5-4.2 8.2-10.3 13.6Z';

function SealLetters({ seal, laurel }: { seal: SealText; laurel: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(seal);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let alive = true;
    const style = getComputedStyle(canvas);
    const script = style.getPropertyValue('--seal-script').trim() || SCRIPT;
    const text = style.getPropertyValue('--seal-join').trim() || TEXT;
    const draw = () => {
      if (!alive) return;
      const css = canvas.clientWidth;
      if (!css) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = canvas.height = Math.round(css * dpr);
      const ctx = canvas.getContext('2d');
      // the laurel only where the seal is large enough to read it
      if (ctx) press(ctx, canvas.width, JSON.parse(key) as SealText, script, text, laurel && css >= 90);
    };
    const fontsReady = document.fonts
      ? Promise.all([document.fonts.load(`400 100px ${script}`, key), document.fonts.load(`400 100px ${text}`, key)]).catch(() => undefined)
      : Promise.resolve();
    void fontsReady.then(draw);
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [key, laurel]);
  return <canvas ref={ref} className={s['bl-seal-face']} />;
}

/** Draws the monogram (and the laurel) as one mask, then presses it into the wax. */
function press(ctx: CanvasRenderingContext2D, size: number, seal: SealText, script: string, text: string, laurel: boolean) {
  const mask = document.createElement('canvas');
  mask.width = mask.height = size;
  const m = mask.getContext('2d');
  if (!m) return;
  m.fillStyle = m.strokeStyle = '#000';
  // the letters sit higher when the laurel is under them
  monogram(m, size, seal, script, text, laurel ? { cy: 0.46, w: 0.62, h: 0.44 } : { cy: 0.5, w: 0.74, h: 0.5 });
  if (laurel) wreath(m, size);
  ctx.clearRect(0, 0, size, size);
  relief(ctx, mask, size);
}

function monogram(ctx: CanvasRenderingContext2D, size: number, seal: SealText, script: string, text: string, box: { cy: number; w: number; h: number }) {
  const { list, join } = pieces(seal, script, text);
  const BASE = 100;
  const fontOf = (p: Extract<Piece, { kind: 'text' }>) => `400 ${p.font === script ? BASE : BASE * JOIN}px ${p.font}`;
  const ink = list.map((p) => {
    if (p.kind === 'heart') return { l: 0, r: 0.36 * BASE, a: 0.32 * BASE, d: 0 };
    ctx.font = fontOf(p);
    ctx.direction = p.rtl ? 'rtl' : 'ltr';
    ctx.textAlign = 'left';
    const mt = ctx.measureText(p.text);
    return { l: -mt.actualBoundingBoxLeft, r: mt.actualBoundingBoxRight, a: mt.actualBoundingBoxAscent, d: mt.actualBoundingBoxDescent };
  });
  // the letters on one baseline, measured from their real ink; the joining symbol centred on their height
  const letters = ink.filter((_, i) => i !== join);
  const top = Math.min(...letters.map((x) => -x.a));
  const bottom = Math.max(...letters.map((x) => x.d));
  const gap = 0.1 * BASE;
  let x = 0;
  const placed = list.map((p, i) => {
    const k = ink[i]!;
    const dx = x - k.l;
    const dy = i === join ? (top + bottom) / 2 + (k.a - k.d) / 2 : 0;
    x += k.r - k.l + gap;
    return { p, dx, dy };
  });
  const width = x - gap;
  const height = bottom - top;
  // inside the face, its corners clear of the rim
  const scale = Math.min((box.w * size) / width, (box.h * size) / height, (0.8 * size) / Math.hypot(width, height));
  const ox = size / 2 - (width / 2) * scale;
  const oy = box.cy * size - ((top + bottom) / 2) * scale;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  for (const { p, dx, dy } of placed) {
    ctx.save();
    ctx.translate(dx, dy);
    if (p.kind === 'heart') {
      ctx.translate(0, -0.32 * BASE);
      ctx.scale((0.36 * BASE) / 24, (0.32 * BASE) / 21.5);
      ctx.fill(new Path2D(HEART));
    } else {
      ctx.font = fontOf(p);
      ctx.direction = p.rtl ? 'rtl' : 'ltr';
      ctx.textAlign = 'left';
      ctx.fillText(p.text, 0, 0);
      // thin strokes of the calligraphy would vanish in wax: thicken them a little
      ctx.lineWidth = p.font === script ? (p.rtl ? 0.04 : 0.06) * BASE : 0.02 * BASE;
      ctx.strokeText(p.text, 0, 0);
    }
    ctx.restore();
  }
  ctx.restore();
}

/** Two laurel sprigs curving up from the bottom of the face, around the letters. */
function wreath(ctx: CanvasRenderingContext2D, size: number) {
  const c = size / 2;
  const r = 0.4 * size;
  ctx.save();
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    // from just beside the bottom up to about the middle of the face (angles in radians, 90° is straight down)
    const from = Math.PI / 2 + side * 0.2;
    const to = Math.PI / 2 + side * 1.72;
    ctx.lineWidth = 0.011 * size;
    ctx.beginPath();
    ctx.arc(c, c, r, from, to, side < 0);
    ctx.stroke();
    const leaves = 9;
    for (let i = 0; i < leaves; i++) {
      const t = (i + 0.5) / leaves;
      const a = from + (to - from) * t;
      const px = c + r * Math.cos(a);
      const py = c + r * Math.sin(a);
      // tangent direction along the sprig (towards its tip), leaves angled off it on both sides
      const tangent = a + (side > 0 ? Math.PI / 2 : -Math.PI / 2);
      const len = 0.07 * size * (1 - 0.4 * t);
      for (const lean of [-0.62, 0.62]) {
        leaf(ctx, px, py, tangent + lean * -side, len, len * 0.38);
      }
    }
    // a berry at the tip
    const tip = to + side * 0.04;
    ctx.beginPath();
    ctx.arc(c + r * Math.cos(tip), c + r * Math.sin(tip), 0.013 * size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, len: number, w: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.45, -w, len, 0);
  ctx.quadraticCurveTo(len * 0.45, w, 0, 0);
  ctx.fill();
  ctx.restore();
}

/** Presses a black mask into the wax: shadow, body, lit upper edge, shaded lower edge. */
function relief(ctx: CanvasRenderingContext2D, mask: HTMLCanvasElement, size: number) {
  const d = Math.max(1, 0.012 * size);
  const tint = (fill: string | CanvasGradient, cut?: [number, number]) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d')!;
    x.drawImage(mask, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = fill;
    x.fillRect(0, 0, size, size);
    if (cut) {
      // keep only the edge facing the light (or away from it)
      x.globalCompositeOperation = 'destination-out';
      x.drawImage(mask, cut[0], cut[1]);
    }
    return c;
  };
  const body = ctx.createLinearGradient(0, 0, size, size);
  body.addColorStop(0, '#9b3a43');
  body.addColorStop(0.5, '#7a2129');
  body.addColorStop(1, '#5a1219');

  // the raised wax casts a soft shadow down and to the right
  ctx.save();
  ctx.shadowColor = 'rgb(28 2 6 / 0.75)';
  ctx.shadowOffsetX = 0.7 * d;
  ctx.shadowOffsetY = 1.1 * d;
  ctx.shadowBlur = 1.6 * d;
  ctx.drawImage(tint(body), 0, 0);
  ctx.restore();
  // the upper-left edges catch the light, the lower-right edges turn away from it
  ctx.drawImage(tint('rgb(255 196 196 / 0.75)', [0.55 * d, 0.8 * d]), 0, 0);
  ctx.drawImage(tint('rgb(34 2 8 / 0.65)', [-0.5 * d, -0.75 * d]), 0, 0);
  // a faint gloss across the top of the letters, like the wax around them
  const gloss = ctx.createLinearGradient(0, 0, 0, size);
  gloss.addColorStop(0, 'rgb(255 220 220 / 0.18)');
  gloss.addColorStop(0.55, 'rgb(255 220 220 / 0)');
  ctx.drawImage(tint(gloss), 0, 0);
}

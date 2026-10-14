import { useEffect, useRef } from 'react';
import type { SealText } from './initials';
import o from './opening.module.css';

/**
 * The closed envelope: four flaps cut from one picture along its fold lines, the gold wax seal with the
 * couple's initials on top, and the light that opens it. Purely visual; the open button is outside.
 */
export function Envelope({ seal, onOpen }: { seal: SealText | null; onOpen: () => void }) {
  return (
    <div className={o.envelope} onClick={onOpen} aria-hidden="true">
      <span className={`${o.flap} ${o.flapLeft}`} />
      <span className={`${o.flap} ${o.flapRight}`} />
      <span className={`${o.flap} ${o.flapBottom}`} />
      <span className={`${o.flap} ${o.flapTop}`} />
      <span className={o.glow} />
      <span className={o.seal}>
        <span className={o.sealArt} />
        {seal ? <SealLetters seal={seal} /> : null}
      </span>
      <span className={o.shine} />
    </div>
  );
}

const SCRIPT = '"ROC Script"';
/** The joining symbol's size, relative to the letters. */
const JOIN = 0.72;
const TEXT = '"ROC Text"';
const RTL = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

/** A piece of the monogram: letters (script), the joining symbol (text font) or the drawn heart. */
type Piece = { kind: 'text'; text: string; font: string; rtl: boolean } | { kind: 'heart' };

function pieces(seal: SealText): { list: Piece[]; join: number } {
  if ('custom' in seal) return { list: [{ kind: 'text', text: seal.custom, font: SCRIPT, rtl: RTL.test(seal.custom) }], join: -1 };
  const rtl = RTL.test(seal.first + (seal.second ?? ''));
  const letter = (t: string): Piece => ({ kind: 'text', text: t, font: SCRIPT, rtl });
  const join: Piece | null = seal.join ? (seal.join === '♥' ? { kind: 'heart' } : { kind: 'text', text: seal.join, font: TEXT, rtl: RTL.test(seal.join) }) : null;
  const order = [letter(seal.first), ...(join ? [join] : []), ...(seal.second ? [letter(seal.second)] : [])];
  // Visual order, left to right: Arabic and Kurdish read from the right, so the groom's letter is on the right.
  const list = rtl ? order.reverse() : order;
  return { list, join: join ? 1 : -1 };
}

/** The heart (24 × 21.5), drawn in the letters' colour: the fonts have none, and phones would show a red emoji. */
const HEART = 'M12 21.5 10.3 20C4.2 14.6 0 10.9 0 6.4 0 2.8 2.8 0 6.4 0c2 0 4 .9 5.6 2.4C13.6.9 15.6 0 17.6 0 21.2 0 24 2.8 24 6.4c0 4.5-4.2 8.2-10.3 13.6Z';

/**
 * The initials, engraved into the seal's flat face. Drawn on a canvas from the letters' real ink (not their
 * line boxes): measured, spaced evenly around the joining symbol, scaled to sit well inside the face whatever
 * the script or the number of letters, and centred exactly on it.
 */
function SealLetters({ seal }: { seal: SealText }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(seal);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let alive = true;
    const draw = () => {
      if (!alive) return;
      const css = canvas.clientWidth;
      if (!css) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = canvas.height = Math.round(css * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) engrave(ctx, canvas.width, JSON.parse(key) as SealText);
    };
    const fontsReady = document.fonts
      ? Promise.all([document.fonts.load(`700 100px ${SCRIPT}`, key), document.fonts.load(`600 100px ${TEXT}`, key)]).catch(() => undefined)
      : Promise.resolve();
    void fontsReady.then(draw);
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [key]);
  return <canvas ref={ref} className={o.letters} />;
}

function engrave(ctx: CanvasRenderingContext2D, size: number, seal: SealText) {
  const { list, join } = pieces(seal);
  const BASE = 100;
  const ink = list.map((p) => {
    if (p.kind === 'heart') return { l: 0, r: 0.42 * BASE, a: 0.38 * BASE, d: 0 };
    ctx.font = `${p.font === SCRIPT ? 700 : 600} ${p.font === TEXT ? BASE * JOIN : BASE}px ${p.font}`;
    ctx.direction = p.rtl ? 'rtl' : 'ltr';
    ctx.textAlign = 'left';
    const m = ctx.measureText(p.text);
    return { l: -m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent };
  });
  // the letters sit on one baseline; the joining symbol is centred on the letters' height
  const letters = ink.filter((_, i) => i !== join);
  const top = Math.min(...letters.map((m) => -m.a));
  const bottom = Math.max(...letters.map((m) => m.d));
  const gap = 0.13 * BASE;
  let x = 0;
  const placed = list.map((p, i) => {
    const m = ink[i]!;
    const dx = x - m.l;
    const dy = i === join ? (top + bottom) / 2 + (m.a - m.d) / 2 : 0;
    x += m.r - m.l + gap;
    return { p, dx, dy };
  });
  const width = x - gap;
  const height = bottom - top;
  // fit inside the face: the ink box's diagonal within 76 % of the face (so its corners stay clear of the rim),
  // never taller than half of it
  const face = size;
  const scale = Math.min((0.76 * face) / Math.hypot(width, height), (0.5 * face) / height, (0.8 * face) / width);
  const ox = face / 2 - (width / 2) * scale;
  const oy = face / 2 - ((top + bottom) / 2) * scale;
  ctx.clearRect(0, 0, size, size);
  ctx.lineJoin = 'round';
  // two passes: a light edge below (the face catches the light), then the engraved letters with a dark top edge
  for (const pass of ['light', 'ink'] as const) {
    ctx.save();
    ctx.translate(ox, oy + (pass === 'light' ? 0.045 * BASE * scale : 0));
    ctx.scale(scale, scale);
    const colour = pass === 'light' ? 'rgb(255 238 186 / 0.8)' : '#4f350c';
    ctx.fillStyle = ctx.strokeStyle = colour;
    if (pass === 'ink') {
      ctx.shadowColor = 'rgb(46 28 4 / 0.6)';
      ctx.shadowOffsetY = -0.03 * BASE * scale;
      ctx.shadowBlur = 0.02 * BASE * scale;
    }
    for (const { p, dx, dy } of placed) {
      ctx.save();
      ctx.translate(dx, dy);
      if (p.kind === 'heart') {
        const s = (0.42 * BASE) / 24;
        ctx.translate(0, -0.38 * BASE);
        ctx.scale(s, (0.38 * BASE) / 21.5);
        ctx.fill(new Path2D(HEART));
      } else {
        ctx.font = `${p.font === SCRIPT ? 700 : 600} ${p.font === TEXT ? BASE * JOIN : BASE}px ${p.font}`;
        ctx.direction = p.rtl ? 'rtl' : 'ltr';
        ctx.textAlign = 'left';
        ctx.lineWidth = p.font === SCRIPT ? 0.045 * BASE : 0;
        ctx.fillText(p.text, 0, 0);
        if (ctx.lineWidth) ctx.strokeText(p.text, 0, 0);
      }
      ctx.restore();
    }
    ctx.restore();
  }
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Labels = {
  heading: string;
  help: string;
  pad: string;
  clear: string;
  include: string;
  current: string;
  redraw: string;
  count: string;
  one: string;
  two: string;
  first: string;
  second: string;
};

/**
 * The customer chooses one signature or two (e.g. both of the couple), draws each with a finger or mouse,
 * can clear and try again as often as they like, and chooses whether to include them. Sends `signature`
 * and `signature2`, each a PNG data URL, `keep` (unchanged) or `none`.
 */
export function SignaturePad({ current, labels, error }: { current: string[]; labels: Labels; error?: string }) {
  const [count, setCount] = useState<1 | 2>(current.length === 2 ? 2 : 1);
  const [include, setInclude] = useState(true);

  return (
    <fieldset className="flex flex-col gap-3 rounded-[22px] border border-line bg-paper px-5 py-4">
      <legend className="px-1 text-[15px] font-medium text-heading">{labels.heading}</legend>
      <p className="text-sm text-muted">{labels.help}</p>
      <div role="radiogroup" aria-label={labels.count} className="flex gap-2">
        {([1, 2] as const).map((n) => (
          <label key={n} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-ink">
            <input type="radio" name="signatureCount" value={n} checked={count === n} onChange={() => setCount(n)} className="sr-only" />
            {n === 1 ? labels.one : labels.two}
          </label>
        ))}
      </div>
      <div className={`grid gap-4 ${count === 2 ? 'sm:grid-cols-2' : ''}`}>
        <Pad name="signature" current={current[0] ?? null} include={include} label={count === 2 ? labels.first : labels.pad} labels={labels} />
        {count === 2 ? (
          <Pad name="signature2" current={current[1] ?? null} include={include} label={labels.second} labels={labels} />
        ) : (
          <input type="hidden" name="signature2" value="none" />
        )}
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" checked={include} onChange={(e) => setInclude(e.target.checked)} className="size-5 accent-[#6e1f33]" />
        <span>{labels.include}</span>
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </fieldset>
  );
}

/** One drawing pad (or the saved signature with "draw a new one"). */
function Pad({ name, current, include, label, labels }: { name: string; current: string | null; include: boolean; label: string; labels: Labels }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [drawn, setDrawn] = useState<string | null>(null);
  const [redraw, setRedraw] = useState(!current);

  const setup = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.clientWidth * ratio;
    c.height = c.clientHeight * ratio;
    const ctx = c.getContext('2d')!;
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#1d1d1f';
  }, []);
  useEffect(() => {
    if (redraw) setup();
  }, [redraw, setup]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const ctx = e.currentTarget.getContext('2d')!;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    // Smooth the stroke through the midpoint.
    const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 };
    ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    setDrawn(canvas.current!.toDataURL('image/png'));
  };
  const clear = () => {
    const c = canvas.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setDrawn(null);
  };

  const value = !include ? 'none' : redraw ? (drawn ?? (current ? 'keep' : 'none')) : 'keep';

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={value} />
      {redraw ? (
        <>
          <canvas
            ref={canvas}
            role="img"
            aria-label={label}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onPointerLeave={end}
            className="h-40 w-full touch-none rounded-2xl border border-dashed border-line bg-surface"
          />
          <button type="button" onClick={clear} className="self-start text-sm font-medium text-accent underline underline-offset-4">
            {labels.clear}
          </button>
        </>
      ) : (
        <>
          <span className="text-sm text-muted">{label}</span>
          {/* eslint-disable-next-line @next/next/no-img-element -- the customer's own signature */}
          <img src={current!} alt={labels.current} className="h-24 w-auto self-start rounded-xl bg-surface object-contain p-2" />
          <button type="button" onClick={() => setRedraw(true)} className="self-start text-sm font-medium text-accent underline underline-offset-4">
            {labels.redraw}
          </button>
        </>
      )}
    </div>
  );
}

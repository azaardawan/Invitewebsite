'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { strokePath, strokesBox, strokeTimeline, SIGNATURE_LINE_WIDTH, type SignatureStrokes } from '@/lib/signature-strokes';
import { useReducedMotion } from './runtime';

/** The pad's ink colour: the drawing matches the picture it hands over to. */
const INK = '#1d1d1f';

/**
 * Whether the element can really be seen: on screen and not hidden by the design (an opening screen that keeps
 * the page transparent or hidden until the guest opens it).
 */
function seen(el: Element) {
  const check = (el as Element & { checkVisibility?: (o: object) => boolean }).checkVisibility;
  return check ? check.call(el, { opacityProperty: true, visibilityProperty: true }) : true;
}

/**
 * Waits until `el` is on screen and visible, then calls `go` once. Checks again every so often while it is on
 * screen but still hidden (behind an unopened envelope, say).
 */
function whenSeen(el: Element, go: () => void) {
  let timer: number | undefined;
  let done = false;
  const fire = () => {
    if (done) return;
    if (seen(el)) {
      done = true;
      go();
    } else timer = window.setTimeout(fire, 300);
  };
  if (typeof IntersectionObserver === 'undefined') {
    fire();
    return () => window.clearTimeout(timer);
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) fire();
      else window.clearTimeout(timer);
    },
    { threshold: 0.6 },
  );
  io.observe(el);
  return () => {
    io.disconnect();
    window.clearTimeout(timer);
  };
}

/**
 * One signature that draws itself when it comes into view: the customer's strokes traced at their own pace (pauses
 * shortened, 1–3 s in all), then the picture takes over. A signature drawn before strokes were recorded fades in.
 * Guests who asked their device for less motion see it finished at once.
 */
export function DrawnSignature({
  src,
  strokes,
  alt,
  className,
  style,
}: {
  src: string;
  strokes: SignatureStrokes | null;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLSpanElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [phase, setPhase] = useState<'wait' | 'draw' | 'done'>('wait');
  const drawing = useMemo(() => {
    if (!strokes) return null;
    const view = strokesBox(strokes);
    return { view, paths: strokes.s.map(strokePath), timeline: strokeTimeline(strokes) };
  }, [strokes]);

  useEffect(() => {
    if (reduced || phase !== 'wait' || !box.current) return;
    return whenSeen(box.current, () => setPhase(drawing ? 'draw' : 'done'));
  }, [reduced, phase, drawing]);

  useEffect(() => {
    if (phase !== 'draw' || !drawing || !svg.current || !strokes) return;
    const paths = [...svg.current.querySelectorAll('path')];
    const animations = paths.map((path, i) => {
      const len = path.getTotalLength();
      const { start, duration } = drawing.timeline[i]!;
      path.style.strokeDasharray = `${len} ${len}`;
      path.style.strokeDashoffset = String(len);
      path.style.visibility = 'visible';
      return path.animate(strokeKeyframes(strokes.s[i]!, len), { delay: start, duration, fill: 'forwards', easing: 'linear' });
    });
    const last = drawing.timeline.at(-1);
    const end = window.setTimeout(() => setPhase('done'), last ? last.start + last.duration + 120 : 0);
    return () => {
      window.clearTimeout(end);
      for (const a of animations) a.cancel();
    };
  }, [phase, drawing, strokes]);

  const finished = reduced || phase === 'done';
  return (
    <span ref={box} data-bahja-signature-drawing={finished ? 'done' : phase} style={{ position: 'relative', display: 'inline-block', maxWidth: style?.maxWidth }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- customer image from the platform */}
      <img
        src={src}
        alt={alt}
        className={className}
        // The drawing hands over to the picture in one frame (same ink, same place); without one, the picture fades in.
        style={{ ...style, maxWidth: '100%', opacity: finished ? undefined : 0, transition: drawing ? undefined : 'opacity 0.8s ease' }}
      />
      {drawing && !finished ? (
        <svg
          ref={svg}
          aria-hidden
          className={className}
          viewBox={`${drawing.view.x} ${drawing.view.y} ${drawing.view.width} ${drawing.view.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', maxWidth: 'none', overflow: 'visible', pointerEvents: 'none' }}
        >
          {drawing.paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={INK} strokeWidth={SIGNATURE_LINE_WIDTH} strokeLinecap="round" strokeLinejoin="round" style={{ visibility: 'hidden' }} />
          ))}
        </svg>
      ) : null}
    </span>
  );
}

/** The pen's progress along one stroke at the customer's own speed: how much of the line is drawn at each moment. */
function strokeKeyframes(stroke: readonly number[], len: number): Keyframe[] {
  const n = stroke.length / 3;
  if (n < 2) return [{ strokeDashoffset: len }, { strokeDashoffset: 0 }];
  const t0 = stroke[2]!;
  const t1 = stroke[stroke.length - 1]!;
  let total = 0;
  const along = [0];
  for (let i = 1; i < n; i++) {
    total += Math.hypot(stroke[i * 3]! - stroke[(i - 1) * 3]!, stroke[i * 3 + 1]! - stroke[(i - 1) * 3 + 1]!);
    along.push(total);
  }
  if (t1 <= t0 || total === 0) return [{ strokeDashoffset: len }, { strokeDashoffset: 0 }];
  const frames: Keyframe[] = [];
  let lastOffset = -1;
  for (let i = 0; i < n; i++) {
    const offset = Math.min(1, Math.max(0, (stroke[i * 3 + 2]! - t0) / (t1 - t0)));
    if (offset <= lastOffset) continue;
    frames.push({ offset, strokeDashoffset: len * (1 - along[i]! / total) });
    lastOffset = offset;
  }
  if (frames[0]?.offset !== 0) frames.unshift({ offset: 0, strokeDashoffset: len });
  if (frames.at(-1)?.offset !== 1) frames.push({ offset: 1, strokeDashoffset: 0 });
  return frames;
}

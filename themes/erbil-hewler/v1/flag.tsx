import { useId } from 'react';
import { sunPoints } from './motion';

/*
 * The Kurdish flag in the wind: its three bands and the sun ripple along the cloth (pinned at the pole, freer at the
 * fly end), with a soft fold shading travelling across. Drawn in SVG and animated with SVG <animate> (no script, no
 * layout work); still when the guest prefers reduced motion.
 */
const W = 120;
const H = 80;
const STEPS = 24;
const FRAMES = 8;

/** How far the cloth is lifted at x for wave phase φ: nothing at the pole, most at the fly end. */
const lift = (x: number, phi: number) => 4.5 * (0.15 + 0.85 * (x / W)) * Math.sin((2 * Math.PI * x) / 70 - phi);

/** One band (from y0 to y1 at rest) at phase φ, as a closed path. */
function band(y0: number, y1: number, phi: number) {
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const x = (W * i) / STEPS;
    const dy = lift(x, phi);
    top.push(`${x.toFixed(1)} ${(y0 + dy).toFixed(2)}`);
    bottom.unshift(`${x.toFixed(1)} ${(y1 + dy).toFixed(2)}`);
  }
  return `M${top.join(' L')} L${bottom.join(' L')} Z`;
}

const phases = Array.from({ length: FRAMES + 1 }, (_, i) => (2 * Math.PI * i) / FRAMES);
const frames = (y0: number, y1: number) => phases.map((phi) => band(y0, y1, phi)).join(';');
const BANDS = [
  { fill: '#c8352f', y0: 0, y1: H / 3 },
  { fill: '#fdf8ea', y0: H / 3, y1: (2 * H) / 3 },
  { fill: '#2c8a4f', y0: (2 * H) / 3, y1: H },
].map((b) => ({ ...b, rest: band(b.y0, b.y1, 0), frames: frames(b.y0, b.y1) }));
const CLOTH = { rest: band(0, H, 0), frames: frames(0, H) };
const SUN = sunPoints(0, 0, 10.5, 17.5);
const SUN_MOVES = phases.map((phi) => `${W / 2} ${(H / 2 + lift(W / 2, phi)).toFixed(2)}`).join(';');

export function WavingFlag({
  className,
  still = false,
  seconds = 2.6,
  stretch = false,
  sun = true,
}: {
  className?: string;
  still?: boolean;
  seconds?: number;
  /** Fill the box (the faded sky) instead of keeping the flag's shape. */
  stretch?: boolean;
  sun?: boolean;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const dur = `${seconds}s`;
  return (
    <svg
      className={className}
      viewBox={stretch ? `0 -4 ${W} ${H + 8}` : `-2 -8 ${W + 4} ${H + 16}`}
      preserveAspectRatio={stretch ? 'none' : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-fold`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="70" y2="0" spreadMethod="repeat">
          <stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#000" stopOpacity="0.16" />
          {still ? null : <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="70 0" dur={dur} repeatCount="indefinite" />}
        </linearGradient>
      </defs>
      {BANDS.map((b) => (
        <path key={b.fill} d={b.rest} fill={b.fill}>
          {still ? null : <animate attributeName="d" values={b.frames} dur={dur} repeatCount="indefinite" />}
        </path>
      ))}
      {sun ? (
        <polygon points={SUN} fill="#f1b92f" transform={`translate(${W / 2} ${H / 2})`}>
          {still ? null : <animateTransform attributeName="transform" type="translate" values={SUN_MOVES} dur={dur} repeatCount="indefinite" />}
        </polygon>
      ) : null}
      <path d={CLOTH.rest} fill={`url(#${id}-fold)`}>
        {still ? null : <animate attributeName="d" values={CLOTH.frames} dur={dur} repeatCount="indefinite" />}
      </path>
    </svg>
  );
}

/** The flag's sun on its own, as a soft golden glow (the cover's sky). */
export function SunGlow({ className }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg className={className} viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.45" stopColor="#f6c94f" />
          <stop offset="1" stopColor="#f1b92f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <polygon points={sunPoints(0, 0, 26, 48)} fill={`url(#${id}-glow)`} />
    </svg>
  );
}

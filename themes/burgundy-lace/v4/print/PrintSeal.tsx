import type { SealText } from '../initials';
import p from './shape.module.css';

const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
const HEART = 'M12 21.5 10.3 20C4.2 14.6 0 10.9 0 6.4 0 2.8 2.8 0 6.4 0c2 0 4 .9 5.6 2.4C13.6.9 15.6 0 17.6 0 21.2 0 24 2.8 24 6.4c0 4.5-4.2 8.2-10.3 13.6Z';

/**
 * The wax seal on the printed cards: the same blank wax and the same raised initials as on the invitation
 * (WaxSeal.tsx draws them on a canvas; print has no script, so here they are SVG text with a lighting filter:
 * a highlight on the upper-left edges and a soft shadow below). `seal` null: the rose seal.
 */
export function PrintSeal({ seal, id, className }: { seal: SealText | null; id: string; className?: string }) {
  if (!seal) return <span className={`${p.seal} ${className ?? ''}`} aria-hidden="true" />;
  const filter = `bl-press-${id}`;
  // Arabic letters standing alone are small in their em box (and sit low): larger, and lifted to the centre
  const arabic = RTL.test('custom' in seal ? seal.custom : seal.first + (seal.second ?? ''));
  const grow = arabic ? 1.75 : 1;
  const lift = arabic ? -6 : 0;
  let parts: { text?: string; heart?: boolean; join?: boolean; x: number; size: number }[];
  if ('custom' in seal) {
    parts = [{ text: seal.custom, x: 50, size: Math.min(44, 92 / Math.max(1, Array.from(seal.custom).length * 0.75)) }];
  } else {
    const longest = Math.max(Array.from(seal.first).length, Array.from(seal.second ?? '').length);
    const size = seal.second ? [34, 24, 18][Math.min(longest, 3) - 1]! : 44;
    const rtl = RTL.test(seal.first + (seal.second ?? ''));
    const left = seal.second ? (rtl ? seal.second : seal.first) : seal.first;
    const right = seal.second ? (rtl ? seal.first : seal.second) : null;
    const spread = 14 + size * 0.45;
    parts = right
      ? [
          { text: left, x: 50 - spread, size },
          ...(seal.join ? [seal.join === '♥' ? { heart: true, x: 50, size } : { text: seal.join, join: true, x: 50, size: size * 0.55 }] : []),
          { text: right, x: 50 + spread, size },
        ]
      : [{ text: left, x: 50, size }];
  }
  return (
    <span className={`${p.seal} ${p.sealBlank} ${className ?? ''}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" className={p.sealFace}>
        <defs>
          <filter id={filter} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.7" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="2.4" specularConstant="0.9" specularExponent="16" lightingColor="#ffd2cf" result="light">
              <feDistantLight azimuth="225" elevation="42" />
            </feSpecularLighting>
            <feComposite in="light" in2="SourceAlpha" operator="in" result="lit" />
            <feOffset in="SourceAlpha" dx="0.7" dy="1.1" result="drop" />
            <feGaussianBlur in="drop" stdDeviation="0.8" result="dropBlur" />
            <feFlood floodColor="#1c0205" floodOpacity="0.75" />
            <feComposite in2="dropBlur" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="lit" />
            </feMerge>
          </filter>
        </defs>
        <g filter={`url(#${filter})`} fill="#7c232b" stroke="#7c232b" strokeWidth="0.6" strokeLinejoin="round">
          {parts.map((x, i) =>
            x.heart ? (
              <path key={i} d={HEART} transform={`translate(${x.x - x.size * 0.17} ${50 - x.size * 0.17}) scale(${(x.size * 0.34) / 24})`} />
            ) : (
              <text key={i} x={x.x} y={x.join ? 50 : 50 + lift} fontSize={x.join ? x.size : x.size * grow} textAnchor="middle" dominantBaseline="central" className={x.join ? p.sealJoin : p.sealLetter}>
                {x.text}
              </text>
            ),
          )}
        </g>
      </svg>
    </span>
  );
}

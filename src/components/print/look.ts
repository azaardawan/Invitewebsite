import type { PrintLook } from './ArtworkCard';

export const TINT = { boy: { paper: '#e3eefa', accent: '#3d6fa3' }, girl: { paper: '#fae6ee', accent: '#b04a73' } } as const;

/** Mixes two #rrggbb colours (t = share of b). */
export function mix(a: string, b: string, t: number) {
  const c = (h: string, i: number) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
  return `#${[0, 1, 2].map((i) => Math.round(c(a, i) * (1 - t) + c(b, i) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** The shared look as printed: tinted pink or blue for a girl or boy when the owner asked for it. */
export function tintedLook(look: PrintLook, gender: 'boy' | 'girl' | null): PrintLook {
  if (!look.babyColours || !gender) return look;
  return { ...look, paper: mix(look.paper, TINT[gender].paper, 0.75), accent: mix(look.accent, TINT[gender].accent, 0.7) };
}


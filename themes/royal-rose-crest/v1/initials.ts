import { splitInitials } from '@/theme-sdk';

/**
 * The letters pressed into the wax seal: the groom's and the bride's, joined by the symbol the customer chose.
 * Each comes from the customer's own box (`seal_initials`, two boxes) or, when that box is empty, the first letter of
 * that person's name, in the script it was typed in (Arabic names give Arabic letters). A value typed before the
 * field had two boxes is printed as it was typed.
 */
export type SealText = { first: string; join: string | null; second: string | null } | { custom: string };

function firstLetter(name: string | undefined): string | null {
  const letter = Array.from((name ?? '').trim())[0];
  return letter ? letter.toLocaleUpperCase() : null;
}

export function sealText(fields: Partial<Record<string, string>>, join: string): SealText | null {
  const own = splitInitials(fields.seal_initials?.trim());
  if (own.whole) return { custom: own.first };
  const first = own.first.trim() || firstLetter(fields.person_1_name);
  const second = own.second.trim() || firstLetter(fields.person_2_name);
  if (!first) return second ? { first: second, join: null, second: null } : null;
  return { first, join: second ? join : null, second };
}

/** Rough widths (em) of the monogram's letters in its calligraphy faces, to keep wide pairs inside the shield. */
const WIDE_LATIN = /[MWmw]/;
const NARROW_LATIN = /[IJijlt1]/;
const WIDE_ARABIC = /[سشصضقنيىیئبتثفكکڤطظ]/;
const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-ﻼ]/;
function width(ch: string): number {
  if (ARABIC.test(ch)) return WIDE_ARABIC.test(ch) ? 0.95 : 0.55;
  if (WIDE_LATIN.test(ch)) return 1.05;
  if (NARROW_LATIN.test(ch)) return 0.5;
  return 0.75;
}

/**
 * The crest's monogram: the two letters large, the joining symbol small between them, and `fit`, how much to scale
 * the base size so the whole fits the shield (1 for most pairs, less for two wide letters).
 */
export type Monogram = { first: string; join: string | null; second: string | null; rtl: boolean; fit: number };
export function monogram(seal: SealText): Monogram {
  if ('custom' in seal) {
    const text = seal.custom;
    const w = Array.from(text).reduce((n, ch) => n + (ch === ' ' ? 0.3 : width(ch)), 0);
    return { first: text, join: null, second: null, rtl: ARABIC.test(text), fit: Math.min(1, 1.7 / Math.max(w, 0.01)) };
  }
  // A text-style heart (not the red emoji phones would draw).
  const join = seal.join === '♥' ? '♥︎' : seal.join;
  const w = width(seal.first) + (seal.second ? width(seal.second) : 0) + (join ? 0.32 : 0);
  return { first: seal.first, join, second: seal.second, rtl: ARABIC.test(seal.first + (seal.second ?? '')), fit: Math.min(1, 1.7 / w) };
}

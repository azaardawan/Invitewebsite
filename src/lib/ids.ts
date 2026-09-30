import { randomBytes, randomInt } from 'node:crypto';

/** Crockford base32, lowercase, no i/l/o/u (unambiguous when read aloud or typed). */
const ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

export function randomId(length: number): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i]! & 31];
  return out;
}

/** 10 chars ≈ 50 bits: not enumerable (decision H). */
export function invitationPublicId(): string {
  return randomId(10);
}

export const PUBLIC_ID_PATTERN = /^[0-9a-hjkmnp-tv-z]{10}$/;

/** `ORD-7K2P9X4M` — random, so it reveals nothing about sales volume. */
export function orderNumber(): string {
  return `ORD-${randomId(8).toUpperCase()}`;
}

export function randomDigits(n: number): string {
  return Array.from({ length: n }, () => randomInt(10)).join('');
}

const TRANSLIT: Record<string, string> = {
  ا: 'a', أ: 'a', إ: 'i', آ: 'a', ٱ: 'a', ء: '', ئ: 'e', ؤ: 'o', ب: 'b', ت: 't', ث: 'th', ج: 'j', ح: 'h', خ: 'kh',
  د: 'd', ذ: 'dh', ر: 'r', ز: 'z', س: 's', ش: 'sh', ص: 's', ض: 'd', ط: 't', ظ: 'z', ع: 'a', غ: 'gh', ف: 'f',
  ق: 'q', ك: 'k', ل: 'l', م: 'm', ن: 'n', ه: 'h', ة: 'a', و: 'o', ي: 'i', ى: 'a',
  // Kurdish (Sorani/Badini)
  ڕ: 'r', ڵ: 'l', ۆ: 'o', ێ: 'e', ە: 'a', ڤ: 'v', گ: 'g', پ: 'p', چ: 'ch', ژ: 'zh', ک: 'k', ی: 'i', ھ: 'h', ۊ: 'u',
};

function transliterate(text: string): string {
  let out = '';
  const chars = [...text.normalize('NFKC').toLowerCase()];
  chars.forEach((ch, i) => {
    if (/[a-z0-9]/.test(ch)) out += ch;
    else if (ch === 'و' || ch === 'ي' || ch === 'ی') {
      // Consonant at the start of a word, vowel elsewhere: "وليد" → walid-ish, "علي" → ali.
      const atStart = i === 0 || /\s/.test(chars[i - 1] ?? ' ');
      out += atStart ? (ch === 'و' ? 'w' : 'y') : TRANSLIT[ch];
    } else if (TRANSLIT[ch] !== undefined) out += TRANSLIT[ch];
    else if (/\s|-|_/.test(ch)) out += '-';
  });
  return out;
}

/**
 * Readable, ASCII-only URL part from names in any script (decision I). Purely
 * cosmetic: the public id is authoritative, so an imperfect transliteration is harmless.
 */
export function slugFromNames(names: (string | undefined)[]): string {
  const parts = names
    .filter((n): n is string => Boolean(n?.trim()))
    .map((n) => transliterate(n).replace(/-+/g, '-').replace(/^-|-$/g, ''))
    .filter((p) => p.length >= 2);
  const slug = parts.join('-').replace(/-+/g, '-').slice(0, 40).replace(/-+$/, '');
  return slug.length >= 2 ? slug : '';
}

export function invitationPath(slug: string, publicId: string): string {
  return slug ? `/i/${slug}-${publicId}` : `/i/${publicId}`;
}

/** Extracts the public id from `/i/<slug>-<id>` or `/i/<id>`; null if malformed. */
export function publicIdFromSlugPath(segment: string): string | null {
  const id = segment.slice(-10);
  if (!PUBLIC_ID_PATTERN.test(id)) return null;
  if (segment.length > 10 && segment[segment.length - 11] !== '-') return null;
  return id;
}

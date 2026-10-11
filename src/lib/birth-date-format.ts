/**
 * The date of birth written in the customer's chosen style (newborn designs).
 * Pure and dependency-free (unit-tested); themes and extras receive the finished lines.
 */
import type { CalendarNames } from './invitation-format';

/** Gregorian ("٥ تشرين الأول ٢٠٢٦"), numeric ("٥ / ١٠ / ٢٠٢٦"), Hijri, or Gregorian + Hijri. */
export const BIRTH_DATE_STYLES = ['long', 'numeric', 'hijri', 'both'] as const;
export type DateStyle = (typeof BIRTH_DATE_STYLES)[number];
/** Arabic-Indic (٠١٢٣) or Western (0123) digits; English always uses Western. */
export const BIRTH_DATE_DIGITS = ['arab', 'latn'] as const;
export type DigitStyle = (typeof BIRTH_DATE_DIGITS)[number];
export type BirthDateFormat = { style: DateStyle; digits: DigitStyle };
export const DEFAULT_BIRTH_DATE_FORMAT: BirthDateFormat = { style: 'long', digits: 'arab' };

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type BirthDateLocale = { locale: 'ar' | 'en' | 'ckb' | 'bdn'; intlLocale: string };

function digitsOf(locale: BirthDateLocale['locale'], digits: DigitStyle): 'arab' | 'latn' {
  return locale === 'en' ? 'latn' : digits;
}

function num(n: number, nu: 'arab' | 'latn') {
  return new Intl.NumberFormat(`ar-u-nu-${nu}`, { useGrouping: false }).format(n);
}

function gregorianLong(date: string, loc: BirthDateLocale, nu: 'arab' | 'latn', names: CalendarNames): string {
  const [, y, m, d] = DATE_RE.exec(date)!;
  // Badini has no standard calendar locale data: owner-approved month names.
  if (loc.locale === 'bdn') return `${num(Number(d), nu)} ${names.months[`m${Number(m)}`] ?? ''} ${num(Number(y), nu)}`;
  return new Intl.DateTimeFormat(`${loc.intlLocale}-u-nu-${nu}`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

function hijri(date: string, loc: BirthDateLocale, nu: 'arab' | 'latn'): string {
  // Hijri month names are Arabic in Kurdish use too; English has its own transliteration.
  const base = loc.locale === 'en' ? 'en-GB' : 'ar';
  return new Intl.DateTimeFormat(`${base}-u-ca-islamic-umalqura-nu-${nu}`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

/** One or two lines (style `both` gives Gregorian then Hijri). Null for an invalid date. */
export function formatBirthDate(date: string | undefined, style: DateStyle, digits: DigitStyle, loc: BirthDateLocale, names: CalendarNames): string[] | null {
  const m = date ? DATE_RE.exec(date) : null;
  if (!m || Number.isNaN(new Date(`${date}T12:00:00Z`).getTime())) return null;
  const nu = digitsOf(loc.locale, digits);
  switch (style) {
    case 'long':
      return [gregorianLong(date!, loc, nu, names)];
    case 'numeric': {
      const parts = [Number(m[3]), Number(m[2]), Number(m[1])].map((n) => num(n, nu));
      return [parts.join(' / ')];
    }
    case 'hijri':
      return [hijri(date!, loc, nu)];
    case 'both':
      return [gregorianLong(date!, loc, nu, names), hijri(date!, loc, nu)];
  }
}

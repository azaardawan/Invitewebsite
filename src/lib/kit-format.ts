/**
 * Birth-date wording for design kits, in the customer's chosen style.
 * Pure and dependency-free (unit-tested); themes receive the finished lines.
 */
import type { DateStyle, DigitStyle } from '@/catalog/kit';
import type { CalendarNames } from './invitation-format';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type KitDateLocale = { locale: 'ar' | 'en' | 'ckb' | 'bdn'; intlLocale: string };

function digitsOf(locale: KitDateLocale['locale'], digits: DigitStyle): 'arab' | 'latn' {
  return locale === 'en' ? 'latn' : digits;
}

function num(n: number, nu: 'arab' | 'latn') {
  return new Intl.NumberFormat(`ar-u-nu-${nu}`, { useGrouping: false }).format(n);
}

function gregorianLong(date: string, loc: KitDateLocale, nu: 'arab' | 'latn', names: CalendarNames): string {
  const [, y, m, d] = DATE_RE.exec(date)!;
  // Badini has no standard calendar locale data: owner-approved month names.
  if (loc.locale === 'bdn') return `${num(Number(d), nu)} ${names.months[`m${Number(m)}`] ?? ''} ${num(Number(y), nu)}`;
  return new Intl.DateTimeFormat(`${loc.intlLocale}-u-nu-${nu}`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

function hijri(date: string, loc: KitDateLocale, nu: 'arab' | 'latn'): string {
  // Hijri month names are Arabic in Kurdish use too; English has its own transliteration.
  const base = loc.locale === 'en' ? 'en-GB' : 'ar';
  return new Intl.DateTimeFormat(`${base}-u-ca-islamic-umalqura-nu-${nu}`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

/** One or two lines (style `both` gives Gregorian then Hijri). Null for an invalid date. */
export function formatBirthDate(date: string | undefined, style: DateStyle, digits: DigitStyle, loc: KitDateLocale, names: CalendarNames): string[] | null {
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

import { formatNumber, type InvitationLocale } from '@/theme-sdk';
import { classYear } from '../names';

/** The event date written as on the poster: 20.10.2029 (digits in the invitation's numerals). */
export function numericDate(iso: string | undefined, locale: InvitationLocale): string | null {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const n = (v: string) => (locale === 'en' ? v : v.replace(/\d/g, (x) => formatNumber(Number(x), locale)));
  return `${n(m[3]!)}.${n(m[2]!)}.${n(m[1]!)}`;
}

/** "Class of …": the customer's year (in the invitation's numerals) or the year of the celebration. */
export function yearOf(typed: string | undefined, eventYear: string | undefined, locale: InvitationLocale): string | null {
  const t = typed?.trim();
  return classYear(t && /^\d+$/.test(t) ? formatNumber(Number(t), locale) : t, eventYear);
}

import { formatNumber, type InvitationLocale } from '@/theme-sdk';

export type MonthGrid = {
  /** Narrow weekday names, Monday first; empty where the language has no reliable short names (Kurdish). */
  weekdays: string[];
  /** Leading blanks (null) and then each day of the month, in the invitation's digits. */
  days: (string | null)[];
  /** Index into `days` of the wedding day. */
  weddingIndex: number;
};

/** The wedding day's month as a calendar grid, in Baghdad time (the event's own time zone). */
export function monthGrid(startsAt: string | null, locale: InvitationLocale): MonthGrid | null {
  if (!startsAt) return null;
  const at = new Date(startsAt);
  if (Number.isNaN(at.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baghdad', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(at);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const year = part('year');
  const month = part('month');
  const day = part('day');
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7; // Monday = 0
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const tag = locale === 'en' ? 'en-GB' : locale === 'ar' ? 'ar-IQ' : null;
  const weekdays = tag
    ? Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(tag, { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + i, 12))))
    : [];
  const days: (string | null)[] = [...Array<null>(firstWeekday).fill(null), ...Array.from({ length: total }, (_, i) => formatNumber(i + 1, locale))];
  return { weekdays, days, weddingIndex: firstWeekday + day - 1 };
}

/** Two-digit countdown numbers, in the invitation's digits. */
export function twoDigits(n: number, locale: InvitationLocale): string {
  return n < 10 ? formatNumber(0, locale) + formatNumber(n, locale) : formatNumber(n, locale);
}

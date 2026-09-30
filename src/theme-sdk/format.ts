/**
 * Pure formatting helpers of the Theme Contract. Safe in server components
 * (print companions) and client components alike.
 */

export type ThemeLocale = 'ar' | 'en' | 'ckb' | 'bdn';

const INTL_LOCALE: Record<ThemeLocale, string> = { ar: 'ar-IQ', en: 'en-GB', ckb: 'ckb-IQ', bdn: 'ar-IQ' };
/** Invitations are for events in Iraq (UTC+3, no daylight saving). */
const EVENT_UTC_OFFSET = '+03:00';

/** `event_date` (YYYY-MM-DD) + `event_time` (HH:mm) as an instant, or null if not parseable. */
export function eventInstant(date: string | undefined, time: string | undefined): Date | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : '00:00';
  const d = new Date(`${date}T${t}:00${EVENT_UTC_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const part = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) =>
  parts.find((p) => p.type === type)?.value ?? '';

/*
 * Dates are assembled from parts rather than using the formatted string, whose
 * punctuation differs between ICU versions (Node vs. browsers) and would make
 * server-rendered text disagree with the client.
 */

/** Localized long date, e.g. "الخميس، ١٧ كانون الأول ٢٠٢٦". Falls back to the raw value. */
export function formatEventDate(date: string | undefined, locale: ThemeLocale): string {
  const d = eventInstant(date, '12:00');
  if (!d) return date ?? '';
  const parts = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Baghdad',
  }).formatToParts(d);
  const comma = locale === 'en' ? ',' : '،';
  return `${part(parts, 'weekday')}${comma} ${part(parts, 'day')} ${part(parts, 'month')} ${part(parts, 'year')}`;
}

/** Localized 12-hour time, e.g. "٧:٣٠ م" / "7:30 pm". Falls back to the raw value. */
export function formatEventTime(date: string | undefined, time: string | undefined, locale: ThemeLocale): string {
  const d = eventInstant(date ?? '2000-01-01', time);
  if (!d || !time) return time ?? '';
  const parts = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Baghdad',
  }).formatToParts(d);
  return `${part(parts, 'hour')}:${part(parts, 'minute')} ${part(parts, 'dayPeriod')}`.trim();
}

/** Formats a number with the locale's digits. */
export function formatNumber(n: number, locale: ThemeLocale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale]).format(n);
}

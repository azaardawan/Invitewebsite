/**
 * Pure helpers used by the platform to prepare theme data. Kept dependency-free
 * so they can be unit-tested and reused for PDFs later.
 */

/** Map links must be https and point at a known map provider. */
const MAP_HOSTS = new Set([
  'maps.google.com',
  'www.google.com',
  'google.com',
  'maps.app.goo.gl',
  'goo.gl',
  'maps.apple.com',
  'waze.com',
  'www.waze.com',
  'ul.waze.com',
]);

export function safeMapUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (!MAP_HOSTS.has(url.hostname.toLowerCase())) return null;
    if ((url.hostname.endsWith('google.com') && url.hostname !== 'maps.google.com') && !url.pathname.startsWith('/maps')) return null;
    if (url.hostname === 'goo.gl' && !url.pathname.startsWith('/maps')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Event start as an ISO string in Baghdad time (UTC+3, no daylight saving). */
export function eventStartIso(date: string | undefined, time: string | undefined): string | null {
  if (!date || !DATE_RE.test(date)) return null;
  const t = time && TIME_RE.test(time) ? time : '00:00';
  const d = new Date(`${date}T${t}:00+03:00`);
  return Number.isNaN(d.getTime()) ? null : `${date}T${t}:00+03:00`;
}

export type CalendarNames = {
  months: Record<string, string>;
  weekdays: Record<string, string>;
  am: string;
  pm: string;
};

/**
 * Localized date parts. Uses the runtime's calendar data when the language
 * has it (Arabic, English, Sorani); otherwise `names` from translations
 * (Badini, which has no standard locale data) with Arabic-Indic digits.
 */
export function formatEventDate(
  date: string,
  intlLocale: string | null,
  names: CalendarNames,
): { full: string; weekday: string; day: string; month: string; year: string } | null {
  const m = DATE_RE.exec(date);
  if (!m) return null;
  const at = new Date(`${date}T12:00:00+03:00`);
  if (intlLocale) {
    const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(intlLocale, { timeZone: 'Asia/Baghdad', ...o }).format(at);
    return {
      full: f({ dateStyle: 'full' }),
      weekday: f({ weekday: 'long' }),
      day: f({ day: 'numeric' }),
      month: f({ month: 'long' }),
      year: f({ year: 'numeric' }),
    };
  }
  const digits = new Intl.NumberFormat('ar-IQ', { useGrouping: false });
  const weekday = names.weekdays[`d${at.getUTCDay()}`] ?? '';
  const day = digits.format(Number(m[3]));
  const month = names.months[`m${Number(m[2])}`] ?? '';
  const year = digits.format(Number(m[1]));
  return { full: `${weekday}، ${day} ${month} ${year}`, weekday, day, month, year };
}

export function formatEventTime(time: string, intlLocale: string | null, names: CalendarNames): string | null {
  const m = TIME_RE.exec(time);
  if (!m) return null;
  if (intlLocale) {
    return new Intl.DateTimeFormat(intlLocale, { timeStyle: 'short', timeZone: 'Asia/Baghdad' }).format(
      new Date(`2000-01-01T${time}:00+03:00`),
    );
  }
  const h = Number(m[1]);
  const digits = new Intl.NumberFormat('ar-IQ', { minimumIntegerDigits: 2, useGrouping: false });
  return `${new Intl.NumberFormat('ar-IQ').format(h % 12 || 12)}:${digits.format(Number(m[2]))} ${h < 12 ? names.am : names.pm}`;
}

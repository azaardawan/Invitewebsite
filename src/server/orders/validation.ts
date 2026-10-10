import 'server-only';
import { safeMapUrl } from '@/lib/invitation-format';
import { normalizePhone, toAsciiDigits } from '@/lib/phone';

export type FieldError =
  | 'required'
  | 'tooLong'
  | 'invalidText'
  | 'invalidDate'
  | 'pastDate'
  | 'tooFar'
  | 'futureDate'
  | 'tooOld'
  | 'invalidTime'
  | 'invalidMapUrl'
  | 'invalidPhone'
  | 'invalidUrl';

export type FieldDef = { type: string; maxLength: number | null };

const DEFAULT_MAX = { text: 80, longtext: 500 } as const;
const MAX_DAYS_AHEAD = 730;
/** A past date (e.g. a birth date) may be at most this old. */
const MAX_YEARS_BACK = 5;

/** Today's date in Baghdad as YYYY-MM-DD. */
export function baghdadToday(now = new Date()): string {
  return new Date(now.getTime() + 3 * 3600_000).toISOString().slice(0, 10);
}

function cleanText(value: string, multiline: boolean): string | null {
  // Strip invisible control characters (keep newlines for long text).
  const cleaned = value.normalize('NFC').replace(multiline ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, '');
  const collapsed = multiline ? cleaned.replace(/\n{3,}/g, '\n\n') : cleaned.replace(/\s+/g, ' ');
  return collapsed.trim() || null;
}

/**
 * Server-side validation of customer-entered invitation fields. Every field the
 * package includes is required; anything else is dropped. Never trust the form.
 */
export function validateFieldValues(
  input: Record<string, unknown>,
  fieldKeys: readonly string[],
  defs: ReadonlyMap<string, FieldDef>,
  now = new Date(),
): { ok: true; values: Record<string, string> } | { ok: false; errors: Record<string, FieldError> } {
  const values: Record<string, string> = {};
  const errors: Record<string, FieldError> = {};
  const today = baghdadToday(now);
  const latest = baghdadToday(new Date(now.getTime() + MAX_DAYS_AHEAD * 86400_000));

  for (const key of fieldKeys) {
    const def = defs.get(key);
    const raw = input[key];
    if (typeof raw !== 'string' || raw.trim() === '') {
      errors[key] = 'required';
      continue;
    }
    switch (def?.type) {
      case 'text':
      case 'longtext': {
        const multiline = def.type === 'longtext';
        const v = cleanText(raw, multiline);
        if (!v) errors[key] = 'required';
        else if (v.length > (def.maxLength ?? DEFAULT_MAX[def.type])) errors[key] = 'tooLong';
        else values[key] = v;
        break;
      }
      case 'date': {
        const v = toAsciiDigits(raw.trim());
        const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00Z`) : null;
        if (!d || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) errors[key] = 'invalidDate';
        else if (v < today) errors[key] = 'pastDate';
        else if (v > latest) errors[key] = 'tooFar';
        else values[key] = v;
        break;
      }
      case 'past_date': {
        const v = toAsciiDigits(raw.trim());
        const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00Z`) : null;
        const earliest = `${Number(today.slice(0, 4)) - MAX_YEARS_BACK}${today.slice(4)}`;
        if (!d || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) errors[key] = 'invalidDate';
        else if (v > today) errors[key] = 'futureDate';
        else if (v < earliest) errors[key] = 'tooOld';
        else values[key] = v;
        break;
      }
      case 'time': {
        const v = toAsciiDigits(raw.trim());
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) errors[key] = 'invalidTime';
        else values[key] = v;
        break;
      }
      case 'url': {
        if (key === 'venue_map_url') {
          const v = safeMapUrl(raw);
          if (!v) errors[key] = 'invalidMapUrl';
          else values[key] = v;
        } else {
          try {
            const u = new URL(raw.trim());
            if (u.protocol !== 'https:') throw new Error();
            values[key] = u.toString();
          } catch {
            errors[key] = 'invalidUrl';
          }
        }
        break;
      }
      case 'phone': {
        const v = normalizePhone(raw);
        if (!v) errors[key] = 'invalidPhone';
        else values[key] = v;
        break;
      }
      default:
        errors[key] = 'invalidText';
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, values };
}

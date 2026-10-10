import 'server-only';
import type { FieldKey } from '@/catalog/fields';
import { DATE_STYLES, DIGIT_STYLES, unitGeometry, type KitOptions, type KitUnitKey } from '@/catalog/kit';
import { localeMeta, type Locale } from '@/i18n/config';
import { messagesFor } from '@/i18n/messages';
import { formatBirthDate } from '@/lib/kit-format';
import type { CalendarNames } from '@/lib/invitation-format';
import type { InvitationMode, KitProps } from '@/theme-sdk/types';
import type { KitDownloadLabels } from '@/components/kit/KitDownloads';

/** The theme's wording in the kit language (`kitCopy.<theme key>`; Kurdish falls back to Arabic until approved). */
export function kitCopy(locale: Locale, themeKey: string): Record<string, string> {
  const all = (messagesFor(locale) as unknown as { kitCopy?: Record<string, Record<string, string>> }).kitCopy ?? {};
  return { ...(all[themeKey] ?? {}) };
}

/**
 * Builds the exact data a kit theme receives for one unit. Only the package's
 * fields are passed, and the birth date arrives already written in the
 * customer's chosen style, so themes never format dates themselves.
 */
export function buildKitProps(input: {
  mode: InvitationMode;
  locale: Locale;
  themeKey: string;
  unit: KitUnitKey;
  fieldKeys: readonly string[];
  values: Partial<Record<string, string>>;
  options: KitOptions;
}): KitProps {
  const fields: Partial<Record<FieldKey, string>> = {};
  for (const key of input.fieldKeys) {
    const v = input.values[key];
    if (typeof v === 'string' && v.trim() !== '') fields[key as FieldKey] = v.trim();
  }
  const meta = localeMeta[input.locale];
  const names = (messagesFor(input.locale) as unknown as { invitation: CalendarNames }).invitation;
  return {
    mode: input.mode,
    locale: input.locale,
    dir: meta.dir,
    lang: meta.htmlLang,
    unit: input.unit,
    size: unitGeometry(input.unit, input.options.bottle),
    fields,
    birthDate: formatBirthDate(fields.birth_date, input.options.dateStyle, input.options.digits, { locale: input.locale, intlLocale: meta.intlLocale }, names),
    copy: kitCopy(input.locale, input.themeKey),
  };
}

/** Sample kit content (short or long names), for previews. */
export function kitSampleValues(locale: Locale, variant: 'short' | 'long', now = new Date()): Record<string, string> {
  const samples = (messagesFor(locale) as unknown as { kitSamples: Record<'short' | 'long', Record<string, string>> }).kitSamples[variant];
  const birth = new Date(now.getTime() - 10 * 86400000).toISOString().slice(0, 10);
  return { ...samples, birth_date: birth };
}

/** The customer's birth date written in every style, for the download options (`${style}:${digits}` → text). */
export function kitDateExamples(birthDate: string | undefined, locale: Locale): Record<string, string> {
  const meta = localeMeta[locale];
  const names = (messagesFor(locale) as unknown as { invitation: CalendarNames }).invitation;
  const out: Record<string, string> = {};
  for (const style of DATE_STYLES) {
    for (const digits of DIGIT_STYLES) {
      out[`${style}:${digits}`] = formatBirthDate(birthDate, style, digits, { locale, intlLocale: meta.intlLocale }, names)?.join('\n') ?? '—';
    }
  }
  return out;
}

/** Labels for the download panel (receipt page and Admin), in the given language. */
export function kitDownloadLabels(locale: Locale) {
  return (messagesFor(locale) as unknown as { kit: { downloads: KitDownloadLabels } }).kit.downloads;
}

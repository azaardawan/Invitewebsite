import 'server-only';
import type { SignatureStrokes } from '@/lib/signature-strokes';
import { sampleNames, type SampleNameLists } from '@/catalog/sample-names';
import type { ThemeBorderSpec } from '@/theme-sdk/border';
import type { FeatureKey } from '@/catalog/features';
import type { FieldKey } from '@/catalog/fields';
import { localeMeta, type Locale } from '@/i18n/config';
import { messagesFor } from '@/i18n/messages';
import { eventStartIso, formatEventDate, formatEventTime, safeMapUrl, type CalendarNames } from '@/lib/invitation-format';
import { DEFAULT_BIRTH_DATE_FORMAT, formatBirthDate, type BirthDateFormat } from '@/lib/birth-date-format';
import type { InvitationMode, ThemeLabels, ThemeProps } from '@/theme-sdk/types';
import { wordingDefault, type DesignSwitch, type WordingLine } from '@/theme-sdk/manifest';

type InvitationMessages = ThemeLabels &
  CalendarNames & { previewRibbon: string; sampleRibbon: string; renderError: string; retry: string; previewExpired: string; and: string; youreInvited: string; endedTitle: string; endedBody: string; brand: string };

export function invitationMessages(locale: Locale): InvitationMessages {
  return (messagesFor(locale) as unknown as { invitation: InvitationMessages }).invitation;
}

const LABEL_KEYS = [
  'openInvitation', 'musicPlay', 'musicPause', 'countdownDays', 'countdownHours', 'countdownMinutes',
  'countdownSeconds', 'eventStarted', 'openMap', 'date', 'time', 'venue', 'guestFormTitle', 'guestName',
  'attendanceQuestion', 'attending', 'notAttending', 'message', 'submit', 'sending', 'sent', 'sentPreview',
  'errorRequired', 'errorTooLong', 'errorGeneric', 'guestbookTitle', 'guestbookEmpty', 'and',
  'attendanceTitle', 'attendingCount', 'notAttendingCount', 'itsABoy', 'itsAGirl', 'bornOn', 'partySize', 'partyFewer',
  'partyMore',
] as const satisfies readonly (keyof ThemeLabels)[];

/**
 * A date such as a receipt or policy date ("1 November 2026"), in the site
 * language. Badini uses its approved month names (no standard locale data).
 */
export function formatLongDate(at: Date, locale: Locale): string {
  if (locale !== 'bdn') return new Intl.DateTimeFormat(localeMeta[locale].intlLocale, { dateStyle: 'long', timeZone: 'Asia/Baghdad' }).format(at);
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baghdad' }).format(at).split('-').map(Number);
  const digits = new Intl.NumberFormat('ar-IQ', { useGrouping: false });
  const months = (invitationMessages('bdn') as unknown as { months: Record<string, string> }).months;
  return `${digits.format(d!)} ${months[`m${m}`] ?? ''} ${digits.format(y!)}`;
}

/** Badini has no standard calendar locale data; its names come from owner-approved translations. */
function calendarLocale(locale: Locale): string | null {
  return locale === 'bdn' ? null : localeMeta[locale].intlLocale;
}

/**
 * Builds the exact data a theme receives. Only package-enabled fields and
 * features are passed, so a theme cannot show something that wasn't bought.
 */
export function buildThemeProps(input: {
  mode: InvitationMode;
  locale: Locale;
  fieldKeys: readonly string[];
  features: readonly string[];
  values: Partial<Record<string, string>>;
  musicSrc: string | null;
  /** Public guest messages (live, customer opted in); omitted = private. Sample mode shows examples. */
  guestbook?: { guestName: string; message: string }[] | null;
  /** The owner's replacement border (Admin); omitted/null = the theme's own. */
  border?: ThemeBorderSpec | null;
  /** Reply counts (live, customer opted in); omitted = private. */
  attendance?: { attending: number; notAttending: number } | null;
  /** URLs of the customer's signature images (none, one or two), when they included them. */
  signatureSrcs?: readonly string[];
  /** How each signature was drawn (same order); given only where the design should draw them again. */
  signatureStrokes?: readonly (SignatureStrokes | null)[];
  /** The theme's colour slots (manifest) and the customer's chosen colours (or none = defaults). */
  colorSlots?: readonly { key: string; default: string }[];
  colors?: Record<string, string> | null;
  /** The occasion (section key) the invitation is for. */
  occasion?: string | null;
  /** How the customer wants the date of birth written (newborn); omitted = Gregorian, Arabic-Indic digits. */
  birthDateFormat?: BirthDateFormat;
  /** The design's changeable lines (manifest) and the customer's choices (absent = the Arabic default). */
  wordingLines?: readonly WordingLine[];
  wording?: Record<string, string> | null;
  /** The design's yes/no choices (manifest) and the customer's answers (absent = the default). */
  switchDefs?: readonly DesignSwitch[];
  switches?: Record<string, boolean> | null;
  /** The customer's photos in order (packages with `photos`), and the design's photo settings (for samples and names). */
  photos?: readonly { src: string; width: number; height: number; focus: { x: number; y: number; zoom: number } }[];
  photoSpec?: { max: number; labels?: readonly { ar: string; en: string; ckb?: string; bdn?: string }[] } | null;
}): ThemeProps {
  const msgs = invitationMessages(input.locale);
  const fields: Partial<Record<FieldKey, string>> = {};
  for (const key of input.fieldKeys) {
    const v = input.values[key];
    if (typeof v === 'string' && v.trim() !== '') fields[key as FieldKey] = v.trim();
  }
  const features = [...input.features] as FeatureKey[];
  const cal = calendarLocale(input.locale);
  const labels = Object.fromEntries(LABEL_KEYS.map((k) => [k, msgs[k]])) as ThemeLabels;

  return {
    mode: input.mode,
    locale: input.locale,
    dir: localeMeta[input.locale].dir,
    lang: localeMeta[input.locale].htmlLang,
    fields,
    features,
    labels,
    event: {
      startsAt: eventStartIso(fields.event_date, fields.event_time),
      date: fields.event_date ? formatEventDate(fields.event_date, cal, msgs) : null,
      time: fields.event_time ? formatEventTime(fields.event_time, cal, msgs) : null,
    },
    mapUrl: features.includes('map') ? safeMapUrl(fields.venue_map_url) : null,
    music: features.includes('music') && input.musicSrc ? { src: input.musicSrc } : null,
    guestbook: !features.includes('congratulations')
      ? null
      : input.mode === 'sample'
        ? sampleGuestbook(input.locale)
        : (input.guestbook ?? null),
    attendance: features.includes('rsvp') ? (input.attendance ?? null) : null,
    signatures: !features.includes('signature') ? [] : input.mode === 'sample' ? [{ src: SAMPLE_SIGNATURE }] : (input.signatureSrcs ?? []).map((src, i) => (input.signatureStrokes ? { src, strokes: input.signatureStrokes[i] ?? null } : { src })),
    colors: resolveColors(input.colorSlots ?? [], input.colors ?? null),
    border: input.border ?? null,
    occasion: input.occasion ?? null,
    birthDate: birthDateParts(fields.birth_date, input.locale, cal, msgs, input.birthDateFormat ?? DEFAULT_BIRTH_DATE_FORMAT),
    wording: resolveWording(input.wordingLines ?? [], input.wording ?? null, input.locale),
    switches: resolveSwitches(input.switchDefs ?? [], input.switches ?? null),
    photos: resolvePhotos(features, input.mode, input.locale, input.photos ?? [], input.photoSpec ?? null),
  };
}

/** Placeholder pictures for samples (no real people), used in turn for every place a design has. */
export const SAMPLE_PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `/samples/photos/photo-${n}.webp`);

/** The photos a theme shows: the customer's (or placeholders in samples), each with the design's name for its place. */
export function resolvePhotos(
  features: readonly string[],
  mode: InvitationMode,
  locale: Locale,
  photos: readonly { src: string; width: number; height: number; focus: { x: number; y: number; zoom: number } }[],
  spec: { max: number; labels?: readonly { ar: string; en: string; ckb?: string; bdn?: string }[] } | null,
): ThemeProps['photos'] {
  if (!features.includes('photos')) return [];
  const label = (i: number) => {
    const l = spec?.labels?.[i];
    return l ? (l[locale] ?? l.ar) : null;
  };
  if (mode === 'sample') {
    return Array.from({ length: spec?.max ?? 1 }, (_, i) => ({ index: i, src: SAMPLE_PHOTOS[i % SAMPLE_PHOTOS.length]!, width: 900, height: 1200, focus: { x: 50, y: 50, zoom: 1 }, label: label(i) }));
  }
  return photos.slice(0, spec?.max ?? photos.length).map((p, i) => ({ index: i, src: p.src, width: p.width, height: p.height, focus: p.focus, label: label(i) }));
}

/** Each yes/no choice: the customer's answer, else the design's default. */
export function resolveSwitches(defs: readonly DesignSwitch[], chosen: Record<string, boolean> | null): Record<string, boolean> {
  return Object.fromEntries(defs.map((d) => [d.key, typeof chosen?.[d.key] === 'boolean' ? chosen[d.key]! : d.default]));
}

/** Each changeable line: the customer's text when they chose one, else the default for the language. */
export function resolveWording(lines: readonly WordingLine[], chosen: Record<string, string> | null, locale: Locale): Record<string, string> {
  return Object.fromEntries(lines.map((l) => [l.key, chosen?.[l.key]?.trim() || wordingDefault(l, locale)]));
}

/** The date of birth's parts plus its lines in the customer's chosen style. */
function birthDateParts(date: string | undefined, locale: Locale, cal: string | null, msgs: InvitationMessages, format: BirthDateFormat) {
  const parts = date ? formatEventDate(date, cal, msgs) : null;
  if (!parts) return null;
  const lines = formatBirthDate(date, format.style, format.digits, { locale, intlLocale: localeMeta[locale].intlLocale }, msgs) ?? [parts.full];
  return { ...parts, lines };
}

/** The theme's colours: each slot's chosen colour (when valid) or its default. */
export function resolveColors(slots: readonly { key: string; default: string }[], chosen: Record<string, string> | null): Record<string, string> {
  const hex = /^#[0-9a-fA-F]{6}$/;
  return Object.fromEntries(slots.map((s) => [s.key, chosen?.[s.key] && hex.test(chosen[s.key]!) ? chosen[s.key]! : s.default]));
}

/** CSS variables for a theme's colours (`--bahja-color-<key>`), set by the platform around the theme. */
export function colorVariables(colors: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(colors).map(([k, v]) => [`--bahja-color-${k}`, v]));
}

/** An example signature (dark ink, transparent) for samples and theme previews. */
const SAMPLE_SIGNATURE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 90"><path d="M12 62c18-30 34-46 42-40s-14 44-6 46 26-40 34-38-8 34 0 34 22-26 30-24-4 22 4 22 18-14 26-14 10 10 22 8 30-10 40-12" fill="none" stroke="#1d1d1f" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
)}`;

/** Example messages so theme samples and Admin previews show the public messages section. */
function sampleGuestbook(locale: Locale) {
  const s = (messagesFor(locale) as unknown as { invitationSamples: Record<string, string> }).invitationSamples;
  return [1, 2, 3].map((i) => ({ guestName: s[`m${i}Name`] ?? '', message: s[`m${i}Text`] ?? '' })).filter((m) => m.guestName && m.message);
}

/**
 * Sample content for theme previews (short or long names), in the invitation language. `seed` (the design's
 * permanent number) picks its own example names, so designs don't all show the same ones; a design for a girl
 * shows a girl's name.
 */
export function sampleValues(
  locale: Locale,
  variant: 'short' | 'long',
  opts: { now?: Date; babyGender?: 'boy' | 'girl'; seed?: number } = {},
): Record<string, string> {
  const { names, ...all } = (messagesFor(locale) as unknown as { invitationSamples: Record<'short' | 'long', Record<string, string>> & { names: SampleNameLists } })
    .invitationSamples;
  const now = opts.now ?? new Date();
  const babyGender = opts.babyGender ?? 'boy';
  const date = new Date(now.getTime() + 45 * 86400000).toISOString().slice(0, 10);
  const born = new Date(now.getTime() - 5 * 86400000).toISOString().slice(0, 10);
  return {
    ...all[variant],
    ...sampleNames(names, { seed: opts.seed, variant, babyGender }),
    event_date: date,
    event_time: '19:30',
    venue_map_url: 'https://maps.google.com/?q=Baghdad',
    baby_gender: babyGender,
    birth_date: born,
  };
}

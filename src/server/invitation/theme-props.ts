import 'server-only';
import type { FeatureKey } from '@/catalog/features';
import type { FieldKey } from '@/catalog/fields';
import { localeMeta, type Locale } from '@/i18n/config';
import { messagesFor } from '@/i18n/messages';
import { eventStartIso, formatEventDate, formatEventTime, safeMapUrl, type CalendarNames } from '@/lib/invitation-format';
import type { InvitationMode, ThemeLabels, ThemeProps } from '@/theme-sdk/types';

type InvitationMessages = ThemeLabels &
  CalendarNames & { previewRibbon: string; sampleRibbon: string; renderError: string; retry: string; previewExpired: string };

export function invitationMessages(locale: Locale): InvitationMessages {
  return (messagesFor(locale) as unknown as { invitation: InvitationMessages }).invitation;
}

const LABEL_KEYS = [
  'openInvitation', 'musicPlay', 'musicPause', 'countdownDays', 'countdownHours', 'countdownMinutes',
  'countdownSeconds', 'eventStarted', 'openMap', 'date', 'time', 'venue', 'guestFormTitle', 'guestName',
  'attendanceQuestion', 'attending', 'notAttending', 'message', 'submit', 'sending', 'sent', 'sentPreview',
  'errorRequired', 'errorTooLong', 'errorGeneric',
] as const satisfies readonly (keyof ThemeLabels)[];

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
  };
}

/** Sample content for theme previews (short or long names), in the invitation language. */
export function sampleValues(locale: Locale, variant: 'short' | 'long', now = new Date()): Record<string, string> {
  const samples = (messagesFor(locale) as unknown as { invitationSamples: Record<'short' | 'long', Record<string, string>> })
    .invitationSamples[variant];
  const date = new Date(now.getTime() + 45 * 86400000).toISOString().slice(0, 10);
  return { ...samples, event_date: date, event_time: '19:30', venue_map_url: 'https://maps.google.com/?q=Baghdad' };
}

import type { FeatureKey } from '@/catalog/features';
import type { FieldKey } from '@/catalog/fields';

/** `sample`: storefront/admin demo with sample data · `preview`: customer's pre-payment preview · `live`: published invitation. */
export type InvitationMode = 'sample' | 'preview' | 'live';

export type InvitationLocale = 'ar' | 'en' | 'ckb' | 'bdn';

/** Localized platform strings a theme may show. Themes never hard-code UI text. */
export type ThemeLabels = {
  openInvitation: string;
  musicPlay: string;
  musicPause: string;
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  countdownSeconds: string;
  eventStarted: string;
  openMap: string;
  date: string;
  time: string;
  venue: string;
  guestFormTitle: string;
  guestName: string;
  attendanceQuestion: string;
  attending: string;
  notAttending: string;
  message: string;
  submit: string;
  sending: string;
  sent: string;
  sentPreview: string;
  errorRequired: string;
  errorTooLong: string;
  errorGeneric: string;
  /** Heading of the public guest messages list. */
  guestbookTitle: string;
  /** Shown when the public list is on but nobody has written yet. */
  guestbookEmpty: string;
};

/** One guest message shown under the invitation (only when the customer made them public). */
export type GuestbookMessage = { guestName: string; message: string };

export type EventDateParts = {
  /** e.g. "الخميس، ١٢ تشرين الثاني ٢٠٢٦" — already localized. */
  full: string;
  weekday: string;
  day: string;
  month: string;
  year: string;
};

/**
 * THE THEME CONTRACT. Everything a theme receives. The platform has already
 * validated, sanitized and localized it. Values are plain text: themes must
 * render them as text, never as HTML.
 */
export type ThemeProps = {
  mode: InvitationMode;
  locale: InvitationLocale;
  dir: 'rtl' | 'ltr';
  /** BCP-47 tag for `lang` attributes. */
  lang: string;
  /** Only the fields enabled by the purchased package are present. */
  fields: Partial<Record<FieldKey, string>>;
  /** Features enabled by the package. Anything absent must not be rendered. */
  features: FeatureKey[];
  labels: ThemeLabels;
  event: {
    /** ISO timestamp (Baghdad time) of the event start, for countdowns. Null if no date. */
    startsAt: string | null;
    date: EventDateParts | null;
    /** Localized time, e.g. "٧:٣٠ م". */
    time: string | null;
  };
  /** Validated map link (https, known map providers), or null. */
  mapUrl: string | null;
  /** Assigned song; null when the package has no music or none is assigned. */
  music: { src: string } | null;
  /**
   * Guest messages to show under the invitation, newest first: an array (possibly empty) when the
   * customer chose to show them to everyone; null when they stay private (keepsake only) or the
   * package has no messages. Render nothing when null.
   */
  guestbook: GuestbookMessage[] | null;
};

export type ThemeComponent = (props: ThemeProps) => React.ReactNode;

export function hasFeature(props: Pick<ThemeProps, 'features'>, feature: FeatureKey): boolean {
  return props.features.includes(feature);
}

/** Guest form limits, shared by the theme runtime and the server. */
export const GUEST_LIMITS = { name: 80, message: 500 } as const;

export type GuestAttendance = 'ATTENDING' | 'NOT_ATTENDING';
export type GuestResponseInput = { name: string; attendance: GuestAttendance | null; message?: string };
export type GuestSubmitResult = { ok: true } | { ok: false; error: 'invalid' | 'rateLimited' | 'closed' | 'failed' };

/** Numbers in the invitation's script: Arabic-Indic digits for Arabic and Kurdish, Western for English. */
export function formatNumber(value: number, locale: InvitationLocale): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ar-IQ', { useGrouping: false }).format(value);
}

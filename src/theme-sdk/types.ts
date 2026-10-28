import type { SignatureStrokes } from '@/lib/signature-strokes';
import type { FeatureKey } from '@/catalog/features';
import type { ThemeBorderSpec } from './border';
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
  /** Heading of the public reply count (how many are coming / not coming). */
  attendanceTitle: string;
  /** Label under the number of guests coming. */
  attendingCount: string;
  /** Label under the number of guests not coming. */
  notAttendingCount: string;
  /** The platform's "how many of you" control under the guest form's name: its label and its two buttons. */
  partySize: string;
  partyFewer: string;
  partyMore: string;
  /** Word between two names ("و" / "&"), in the invitation's language. */
  and: string;
  /** Newborn: "It's a boy" / "It's a girl" (for `fields.baby_gender` = `boy` / `girl`). */
  itsABoy: string;
  itsAGirl: string;
  /** Newborn: caption before the date of birth, e.g. "Born on". */
  bornOn: string;
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
  /**
   * How many guests replied "coming" / "not coming", when the customer chose to show it to everyone;
   * null when it stays private or the package has no guest form. `GuestFormSlot` already shows it
   * above the form; a theme that draws its own passes `summary={false}` to the slot.
   */
  attendance: { attending: number; notAttending: number } | null;
  /**
   * The customer's drawn signatures (packages with `signature`, when they chose to include them): one,
   * or two side by side (e.g. both of the couple), as the customer chose. Empty when none. Show them
   * where the design has its signature spot with `<Signature signatures={props.signatures} />` (dark ink,
   * transparent background). Samples and previews show an example signature. On the online invitation
   * `strokes` (how the customer drew it) lets `<Signature>` draw it again; themes never read it themselves.
   */
  signatures: { src: string; strokes?: SignatureStrokes | null }[];
  /**
   * The theme's colour slots (manifest `colors`) with the customer's chosen colour set, or the
   * defaults. The platform also sets them as CSS variables `--bahja-color-<key>` around the theme,
   * so CSS can use `var(--bahja-color-accent)`. Empty when the theme declares no slots.
   */
  colors: Record<string, string>;
  /** The owner's replacement border from Admin, or null to use the theme's own. Render it with `<ThemeBorder>`. */
  border: ThemeBorderSpec | null;
  /**
   * Which occasion this invitation is for, as the section key (e.g. `wedding`, `engagement`). A design sold
   * in several occasions (manifest `sections`) uses it to pick its wording ("حفل الخطوبة" or "حفل الزفاف");
   * a design for one occasion can ignore it. Null only when unknown.
   */
  occasion: string | null;
  /** Newborn: the date of birth (`fields.birth_date`) in the invitation's language, or null. */
  birthDate: BirthDateParts | null;
  /**
   * The design's changeable lines (manifest `wording`), by key: the customer's choice, or the Arabic default.
   * Always has every declared key.
   */
  wording: Readonly<Record<string, string>>;
  /** The design's yes/no choices (manifest `switches`), by key: the customer's answer or the default. */
  switches: Readonly<Record<string, boolean>>;
  /**
   * The customer's own photos (packages with `photos`), in order, at most the manifest's `photos.max`. There may be
   * fewer than the design holds (even none): show what is there and leave the rest out. Samples show placeholder
   * pictures for every place. Draw each with `<Photo photo={…} />`, which keeps the customer's placement in the frame.
   */
  photos: ThemePhoto[];
};

/**
 * One customer photo: its place (`index`, the same as in `props.photos`), its address (sized for the screen; print designs get the full size), its pixel size,
 * where the customer placed it in the design's frame (`focus`, as `<Photo>` applies it), and the design's name for
 * that place (manifest `photos.labels`) in the invitation's language, or null.
 */
export type ThemePhoto = { index: number; src: string; width: number; height: number; focus: { x: number; y: number; zoom: number }; label: string | null };

/**
 * The date of birth: its parts, plus `lines`, the date written the way the customer chose on the order
 * form (Gregorian, numeric, Hijri, or Gregorian + Hijri as two lines). Show `lines` wherever the date is printed.
 */
export type BirthDateParts = EventDateParts & { lines: string[] };

export type ThemeComponent = (props: ThemeProps) => React.ReactNode;

export function hasFeature(props: Pick<ThemeProps, 'features'>, feature: FeatureKey): boolean {
  return props.features.includes(feature);
}

/** Guest form limits, shared by the theme runtime and the server. */
/** `party`: the most people one reply can be for. */
export const GUEST_LIMITS = { name: 80, message: 500, party: 20 } as const;

export type GuestAttendance = 'ATTENDING' | 'NOT_ATTENDING';
/**
 * `partySize`: how many people the reply is for (1 when left out). Themes don't need to send it: the platform adds a
 * "how many of you" control under the form's name field and fills it in.
 */
export type GuestResponseInput = { name: string; attendance: GuestAttendance | null; message?: string; partySize?: number };
export type GuestSubmitResult = { ok: true } | { ok: false; error: 'invalid' | 'rateLimited' | 'closed' | 'failed' };

/** Numbers in the invitation's script: Arabic-Indic digits for Arabic and Kurdish, Western for English. */
export function formatNumber(value: number, locale: InvitationLocale): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ar-IQ', { useGrouping: false }).format(value);
}

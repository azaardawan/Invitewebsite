import type { FeatureKey } from '@/catalog/features';
import type { FieldKey } from '@/catalog/fields';
import type { KitUnitKey, UnitGeometry } from '@/catalog/kit';

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
};

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
};

export type ThemeComponent = (props: ThemeProps) => React.ReactNode;

export function hasFeature(props: Pick<ThemeProps, 'features'>, feature: FeatureKey): boolean {
  return props.features.includes(feature);
}

export type GuestAttendance = 'ATTENDING' | 'NOT_ATTENDING';
export type GuestResponseInput = { name: string; attendance: GuestAttendance | null; message?: string };
export type GuestSubmitResult = { ok: true } | { ok: false; error: 'invalid' | 'rateLimited' | 'closed' | 'failed' };

/** Numbers in the invitation's script: Arabic-Indic digits for Arabic and Kurdish, Western for English. */
export function formatNumber(value: number, locale: InvitationLocale): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ar-IQ', { useGrouping: false }).format(value);
}

/**
 * DESIGN KIT CONTRACT. A kit theme draws one unit (a story, a card, a sticker
 * or a bottle wrap) at a time; the platform sizes it, places it on print
 * sheets, adds crop marks and makes the PNG/PDF files.
 *
 * The unit's element is a CSS size container of exactly `size.width` ×
 * `size.height` CSS px (bleed included), so themes lay out with `cqw`/`cqh`.
 * `--kit-bleed`, `--kit-safe` and `--kit-overlap` are set on it as lengths.
 */
export type KitProps = {
  mode: InvitationMode;
  locale: InvitationLocale;
  dir: 'rtl' | 'ltr';
  lang: string;
  unit: KitUnitKey;
  size: UnitGeometry;
  /** Customer values (plain text). `birth_date` is ISO; show `birthDate` instead. */
  fields: Partial<Record<FieldKey, string>>;
  /** The birth date already written in the customer's chosen style (one or two lines). */
  birthDate: string[] | null;
  /**
   * The theme's wording in the kit's language (`src/i18n/messages/*.json` → `kitCopy.<theme key>`),
   * kept outside the frozen theme folder so the owner can change it. Never hard-code text that can change.
   */
  copy: Record<string, string>;
};

export type KitComponent = (props: KitProps) => React.ReactNode;

/**
 * Print companion contract (docs/ARCHITECTURE_PROPOSAL.md, decision M).
 *
 * A theme's print designs are static React components rendered to PDF by
 * Chromium: `print/Card.tsx` (printable invitation) and `print/Keepsake.tsx`
 * (guest messages). They are server components: no hooks, no animation, no
 * fetching. The platform sets the page size (`@page`) from the manifest and
 * passes plain, already-localized data.
 */
import type { FieldKey } from '@/catalog/fields';
import type { ThemeBorderSpec } from './border';
import type { EventDateParts, InvitationLocale } from './types';

/** Localized platform strings a print design may show. Never hard-code text. */
export type PrintLabels = {
  date: string;
  time: string;
  venue: string;
  /** Word between two names, in the invitation's language. */
  and: string;
  /** Caption under the QR code. */
  scanToOpen: string;
  /** Keepsake title, e.g. "Messages of love". */
  keepsakeTitle: string;
  /** Shown when a keepsake has no messages. */
  keepsakeEmpty: string;
};

type PrintBase = {
  locale: InvitationLocale;
  dir: 'rtl' | 'ltr';
  /** BCP-47 tag for `lang` attributes. */
  lang: string;
  /** Only the fields the package includes. Absent means don't print it. */
  fields: Readonly<Partial<Record<FieldKey, string>>>;
  event: { date: EventDateParts | null; time: string | null };
  labels: PrintLabels;
  /** The owner's replacement border, or null for the theme's own: the same one as on the invitation. */
  border: ThemeBorderSpec | null;
  /** The customer's signatures (packages with `signature`, when included): none, one or two. */
  signatures: { src: string }[];
  /** The theme's colour slots with the customer's chosen colours (also set as `--bahja-color-<key>`). */
  colors: Record<string, string>;
};

export type PrintCardProps = PrintBase & {
  /** QR code image (data URL) linking to the online invitation; null when the theme or the team turns it off. */
  qrDataUrl: string | null;
  /** One extra line the team added for this card only (e.g. "Family invitation"); null when none. Print it near the details. */
  extraLine: string | null;
};

/**
 * The back of the printable card (`print/CardBack.tsx`, optional): the same theme as the front but its
 * own layout. A big title and a smaller message, both written by the customer, then the couple's names
 * (or their signature). Without a CardBack the platform prints a simple back with the theme's border.
 */
export type PrintCardBackProps = PrintBase & {
  /** Big text, e.g. "Thank you". The customer's own, or a default in the invitation's language. */
  title: string;
  /** Smaller text under it; null when the customer left it empty. */
  message: string | null;
};

export type KeepsakeMessage = { guestName: string; message: string };

export type KeepsakeProps = PrintBase & {
  /** Visible messages in the order received. Can be empty or run to several hundred. */
  messages: readonly KeepsakeMessage[];
};

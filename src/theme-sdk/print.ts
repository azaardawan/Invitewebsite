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
import type { BirthDateParts, EventDateParts, InvitationLocale, ThemePhoto } from './types';

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
  /** Newborn: "It's a boy" / "It's a girl", and the caption before the date of birth. */
  itsABoy: string;
  itsAGirl: string;
  bornOn: string;
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
  /** The customer's photos (packages with `photos`), full size for print; draw with `<Photo>`. Placeholders in samples. */
  photos: ThemePhoto[];
  /** The theme's colour slots with the customer's chosen colours (also set as `--bahja-color-<key>`). */
  colors: Record<string, string>;
  /** Newborn: the date of birth in the invitation's language, or null. */
  birthDate: BirthDateParts | null;
  /** The design's changeable lines (manifest `wording`): the customer's choice or the Arabic default. */
  wording: Readonly<Record<string, string>>;
  /** The design's yes/no choices (manifest `switches`): the customer's answer or the default. */
  switches: Readonly<Record<string, boolean>>;
  /** Which occasion (section key, e.g. `wedding`, `engagement`), as on the invitation (`ThemeProps.occasion`). */
  occasion: string | null;
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
  /**
   * The same QR code as the front's (or null). Most designs print it on the front; a design whose front needs the
   * room prints it here instead (and leaves it off its front).
   */
  qrDataUrl: string | null;
};

/**
 * One side of a shaped printed card (`print/Shape.tsx`, manifest `print.shapes`, features `card_leaf` / `card_heart` / `card_arch`). Draw the
 * artwork filling the `widthMm` × `heightMm` box, inside `outline` (this side's cut line as an SVG path in mm:
 * the back's is the front's mirrored). The platform places it on the page, adds the cut line for print
 * shops and makes the transparent PNG. Front: the card's content (names, date…); back: the customer's
 * title and message. A server component, like the card.
 */
export type PrintShapeProps = PrintBase & {
  /** Which of the design's shapes (its manifest key). `widthMm` × `heightMm` is this side's box (a sideways back is landscape). */
  shape: string;
  side: 'front' | 'back';
  widthMm: number;
  heightMm: number;
  outline: string;
  /** QR code to the online invitation, or null; the design prints it on the side it chooses. */
  qrDataUrl: string | null;
  /** Front: one extra line the team added, or null. */
  extraLine: string | null;
  /** Back: the big title (the customer's, or a default) and the smaller message (or null). */
  title: string;
  message: string | null;
};

/**
 * One guest message. `guestName` is the line to print under it: the guest's name and whether they are coming
 * ("Sara · Coming"), so the couple sees it in every design. `name` and `attending` are the two parts, for a design
 * that shows them its own way.
 */
export type KeepsakeMessage = { guestName: string; message: string; name: string; attending: boolean };

export type KeepsakeProps = PrintBase & {
  /** Visible messages in the order received. Can be empty or run to several hundred. */
  messages: readonly KeepsakeMessage[];
};

/**
 * A design's own newborn extras (optional): `print/Story.tsx` (Instagram story, 1080 × 1920 px),
 * `print/Sticker.tsx` (one chocolate sticker, 40 mm, round or square) and `print/Bottle.tsx` (one water-bottle
 * label, size chosen by the customer). Each is drawn inside a box of exactly that size that is a CSS size
 * container, so lay out with `cqw`/`cqh`. The platform clips round stickers, lays the copies out on print
 * sheets, adds the watermark before payment and makes the PNG/PDF files. Artwork the owner uploads in Admin
 * for an extra replaces the design's own. Server components, like the card.
 */
export type PrintExtraProps = {
  locale: InvitationLocale;
  dir: 'rtl' | 'ltr';
  lang: string;
  /** Only the fields the package includes. */
  fields: Readonly<Partial<Record<FieldKey, string>>>;
  /** The date of birth; print `birthDate.lines` (the style the customer chose). */
  birthDate: BirthDateParts | null;
  /** The design's changeable lines (manifest `wording`): the customer's choice or the Arabic default. */
  wording: Readonly<Record<string, string>>;
  /** The design's yes/no choices (manifest `switches`): the customer's answer or the default. */
  switches: Readonly<Record<string, boolean>>;
  labels: Pick<PrintLabels, 'itsABoy' | 'itsAGirl' | 'bornOn' | 'and'>;
  /** Stickers: the shape the customer chose. */
  shape: 'round' | 'square';
  /** The box in CSS px (story) or mm (sticker, bottle label). */
  size: { width: number; height: number; unit: 'px' | 'mm' };
};

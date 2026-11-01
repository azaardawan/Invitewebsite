import type { FieldKey } from '@/catalog/fields';
import type { InvitationLocale, ThemePhoto } from './types';

/**
 * The couple posters (feature `couple_poster`): two A3 posters to print, landscape and portrait, drawn by the design's
 * `print/CouplePoster.tsx` (a server component) inside a box of exactly `size` CSS px; the platform pictures it at print
 * size, adds the watermark before payment and gives out the JPG once paid. The bottom of each poster carries Bahja's
 * own details (`contact`: the website, the WhatsApp or phone number and Instagram, from Admin → Settings).
 */
export type PrintPosterProps = {
  orientation: 'landscape' | 'portrait';
  size: { width: number; height: number };
  locale: InvitationLocale;
  dir: 'rtl' | 'ltr';
  lang: string;
  /** Only the fields the package includes. */
  fields: Readonly<Partial<Record<FieldKey, string>>>;
  /** The design's changeable lines (manifest `wording`). */
  wording: Readonly<Record<string, string>>;
  labels: { and: string };
  /** The customer's photos at full size, in order (may be fewer than the design holds, or none). */
  photos: readonly ThemePhoto[];
  /** A still from the customer's video, or null. */
  still: string | null;
  /**
   * The customer's choices for this poster (made on the order page's poster step): `main` the big picture (null: the
   * video's `still`, or nothing when there is no still either) and `row` the photos for a row (landscape; at most 5).
   */
  main: ThemePhoto | null;
  row: readonly ThemePhoto[];
  /**
   * Every text of this poster, by its key in the manifest's `posters.texts`: the customer's own words for this poster,
   * or what the text starts from (the page's text or the design's default). '' = the customer left it out: print nothing.
   */
  texts: Readonly<Record<string, string>>;
  /** Bahja's details for the bottom: shown as written (the number already spaced for reading). */
  contact: { website: string; phone: string | null; instagram: string | null };
};

/** Each poster's box in CSS px (A3's proportions); pictured three times larger for print (about 220 dpi). */
export const POSTER_SIZES = {
  landscape: { width: 1190, height: 842 },
  portrait: { width: 842, height: 1190 },
} as const;

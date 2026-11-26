import 'server-only';
import { validCap, validPerGuest } from '@/catalog/guest-photos';
import { EVENT_KIND_SECTIONS, EVENT_NAME_MAX, cleanEventName, isEventKind } from '@/catalog/occasion-wording';
import { getSettings } from '@/server/settings/service';
import { newUploadToken } from '@/server/guest-photos/service';
import { cardBackLimits, themeTextLimit } from '@/catalog/text-limits';
import { CARD_SHAPE_FEATURES, MAIN_CARD, chosenCards, shapeIncluded } from '@/catalog/features';
import { and, eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations, sections, themePalettes, themes, type CardOptions } from '@/server/db/schema';
import { storeSignature } from '@/server/media/assets';
import { parseSignatureStrokes } from '@/lib/signature-strokes';
import { MediaError } from '@/server/media/process';
import { isBottleSize } from '@/catalog/products';
import { BIRTH_DATE_DIGITS, BIRTH_DATE_STYLES } from '@/lib/birth-date-format';
import type { Locale } from '@/i18n/config';
import { wordingDefault, type DesignSwitch, type WordingLine } from '@/theme-sdk/manifest';
import { OrderError } from './common';

type InvitationRow = typeof invitations.$inferSelect;

/** Limits for the customer's text on the back of the printable card. */
export const CARD_BACK_LIMITS = { title: 40, message: 300 } as const;

/**
 * Optional choices on the order form, each only for packages that include it:
 * - `cardBack` (print_card): big title and smaller message for the back of the card;
 * - `signature` / `signature2` (signature): each a PNG data URL from a drawing pad, `keep` (unchanged) or
 *   `none`; the customer chooses one signature or two (the second is then `none`);
 * - `paletteId` (color_choice): one of the theme's colour sets, or '' for the theme's own colours;
 * - `stickerShape` (sticker): round or square chocolate stickers, or both (a set of each);
 * - `cardChoices` (card_leaf / card_heart): the printed cards the customer wants, one or several: `a5` (the card itself)
 *   and/or the design's shaped cards the package sells (manifest `print.shapes`); at least one;
 * - `bottleSize` (bottle_label): the bottle the label wraps (src/catalog/products.ts);
 * - `birthDateStyle` / `birthDateDigits` (packages with the date of birth): how the date is written;
 * - `wording` (designs with changeable lines, manifest `wording`): per line `ar` (the Arabic), `lang` (the
 *   design's version in the invitation's language) or `custom` with the customer's own text. What equals the
 *   language's default is not stored, so the default follows a later change of language. A line with
 *   fixed `options` also takes `opt:<n>`; one with `custom: false` refuses the customer's own text;
 * - `switches` (designs with yes/no choices, manifest `switches`): each answer by key.
 */
export type OrderExtras = {
  cardBack?: { title: string; message: string };
  signature?: string;
  signature2?: string;
  /** How each new signature was drawn (JSON from the pad); ignored unless that signature is new. */
  signatureStrokes?: string;
  signature2Strokes?: string;
  paletteId?: string;
  stickerShape?: string;
  cardChoices?: string[];
  bottleSize?: string;
  birthDateStyle?: string;
  birthDateDigits?: string;
  wording?: Record<string, { choice: string; text: string }>;
  switches?: Record<string, boolean>;
  /** The event a wedding or engagement is held as ('' = the section's own), and the customer's own words. */
  eventKind?: string;
  eventName?: string;
  /** Guest photo sharing (add-on, src/catalog/guest-photos.ts): bought or not, its total and each guest's share. */
  guestPhotos?: { on: boolean; cap: number; perGuest: number };
};

/** One changeable line: at most this many characters, on one line, no markup characters. */
function cleanLine(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

/** New signatures already processed and stored (by prestoreSignatures): the asset, or 'invalid'. */
export type StoredSignatures = Partial<Record<'signature' | 'signature2', { id: string } | null | 'invalid'>>;

/**
 * Decodes, re-encodes and stores the new signatures in `extras` *before* the caller opens its transaction: that work
 * takes seconds for a big drawing and must never hold a database connection and a row lock while it runs.
 */
export async function prestoreSignatures(db: DbOrTx, featureKeys: readonly string[], extras: Pick<OrderExtras, 'signature' | 'signature2'>): Promise<StoredSignatures> {
  const stored: StoredSignatures = {};
  if (!featureKeys.includes('signature')) return stored;
  for (const key of ['signature', 'signature2'] as const) {
    const input = extras[key];
    if (input === undefined || input === 'keep' || input === 'none' || input === '') continue;
    try {
      const asset = await storeSignature(db, input);
      stored[key] = asset ? { id: asset.id } : null;
    } catch (e) {
      if (!(e instanceof MediaError)) throw e;
      stored[key] = 'invalid';
    }
  }
  return stored;
}

/** What to store on the invitation for these choices. Throws OrderError('invalidFields') for bad input. */
export async function extrasUpdate(
  db: DbOrTx,
  inv: Pick<InvitationRow, 'themeId' | 'featureKeys' | 'cardOptions' | 'signatureAssetId' | 'signature2AssetId' | 'colors'> & { sectionId?: string | null } &
    Partial<Pick<InvitationRow, 'signatureStrokes' | 'signature2Strokes' | 'paletteIds' | 'guestPhotosToken'>> & {
    fieldKeys?: readonly string[];
    /** For `wording`: the design's changeable lines, what is stored now, and the invitation's language. */
    wordingLines?: readonly WordingLine[];
    wording?: Record<string, string>;
    locale?: Locale;
    /** For `switches`: the design's yes/no choices and what is stored now. */
    switchDefs?: readonly DesignSwitch[];
    switches?: Record<string, boolean>;
    /** For `cardChoices`: the keys of the design's shaped cards (manifest `print.shapes`). */
    cardShapes?: readonly string[];
  },
  extras: OrderExtras,
  /** Signatures already stored by prestoreSignatures (then nothing heavy happens here). */
  stored: StoredSignatures = {},
) {
  const set: Partial<
    Pick<
      InvitationRow,
      | 'cardOptions'
      | 'signatureAssetId'
      | 'signature2AssetId'
      | 'signatureStrokes'
      | 'signature2Strokes'
      | 'colors'
      | 'stickerShape'
      | 'cardChoices'
      | 'bottleSize'
      | 'birthDateStyle'
      | 'birthDateDigits'
      | 'wording'
      | 'switches'
      | 'guestPhotosCap'
      | 'guestPhotosPerGuest'
      | 'guestPhotosToken'
      | 'eventKind'
      | 'eventName'
    >
  > = {};
  const errors: Record<string, string> = {};
  // The design's own limits (src/catalog/text-limits.ts); a text saved before a limit was lowered may stay as it is.
  const [design] = await db.select({ key: themes.key }).from(themes).where(eq(themes.id, inv.themeId));
  const limits = cardBackLimits(design?.key, CARD_BACK_LIMITS);

  // The event (owner, 2026-11-26): a Nishani, a Henna night or the customer's own words, or the section's own ('').
  if (extras.eventKind !== undefined) {
    const kind = extras.eventKind;
    // Only for a wedding or an engagement (owner: the choice is within those two, for now).
    const [section] = inv.sectionId ? await db.select({ key: sections.key }).from(sections).where(eq(sections.id, inv.sectionId)) : [];
    if (!kind) {
      set.eventKind = null;
      set.eventName = null;
    } else if (!isEventKind(kind) || !(EVENT_KIND_SECTIONS as readonly string[]).includes(section?.key ?? '')) errors.eventKind = 'invalid';
    else if (kind === 'custom') {
      const name = cleanEventName(extras.eventName);
      if (!name) errors.eventName = 'required';
      else if ((extras.eventName ?? '').trim().length > EVENT_NAME_MAX) errors.eventName = 'tooLong';
      else {
        set.eventKind = 'custom';
        set.eventName = name;
      }
    } else {
      set.eventKind = kind;
      set.eventName = null;
    }
  }

  // Guest photo sharing: only offered while the owner has it switched on; the price is worked out at checkout.
  if (extras.guestPhotos) {
    const { guestPhotos: pricing } = await getSettings(db);
    const g = extras.guestPhotos;
    if (!g.on || !pricing.enabled) {
      set.guestPhotosCap = null;
      set.guestPhotosPerGuest = null;
    } else if (!validCap(g.cap, pricing) || !validPerGuest(g.perGuest)) errors.guestPhotos = 'invalid';
    else {
      set.guestPhotosCap = g.cap;
      set.guestPhotosPerGuest = g.perGuest;
      if (!inv.guestPhotosToken) set.guestPhotosToken = newUploadToken();
    }
  }

  if (extras.cardBack && inv.featureKeys.includes('print_card')) {
    const title = extras.cardBack.title.trim();
    const message = extras.cardBack.message.replace(/\r\n/g, '\n').trim();
    if (title.length > limits.title && title !== (inv.cardOptions?.backTitle ?? '').trim()) errors.cardBackTitle = 'tooLong';
    if (message.length > limits.message && message !== (inv.cardOptions?.backMessage ?? '').trim()) errors.cardBackMessage = 'tooLong';
    const next: CardOptions = { ...(inv.cardOptions ?? {}) };
    if (title) next.backTitle = title;
    else delete next.backTitle;
    if (message) next.backMessage = message;
    else delete next.backMessage;
    set.cardOptions = next;
  }

  for (const [key, input, column, strokesColumn, strokes] of [
    ['signature', extras.signature, 'signatureAssetId', 'signatureStrokes', extras.signatureStrokes],
    ['signature2', extras.signature2, 'signature2AssetId', 'signature2Strokes', extras.signature2Strokes],
  ] as const) {
    if (input === undefined || input === 'keep' || !inv.featureKeys.includes('signature')) continue;
    if (input === 'none' || input === '') {
      set[column] = null;
      set[strokesColumn] = null;
    } else if (key in stored) {
      const done = stored[key];
      if (done === 'invalid') errors.signature = 'invalid';
      else {
        set[column] = done?.id ?? null;
        set[strokesColumn] = set[column] ? parseSignatureStrokes(strokes) : null;
      }
    } else {
      try {
        set[column] = (await storeSignature(db, input))?.id ?? null;
        // How it was drawn, for the invitation to draw it again (a bad recording just means it appears).
        set[strokesColumn] = set[column] ? parseSignatureStrokes(strokes) : null;
      } catch (e) {
        if (!(e instanceof MediaError)) throw e;
        errors.signature = 'invalid';
      }
    }
  }
  // Only a second signature (the first pad left empty): it becomes the first.
  const first = set.signatureAssetId !== undefined ? set.signatureAssetId : inv.signatureAssetId;
  const second = set.signature2AssetId !== undefined ? set.signature2AssetId : inv.signature2AssetId;
  if (!first && second) {
    set.signatureAssetId = second;
    set.signatureStrokes = set.signature2Strokes !== undefined ? set.signature2Strokes : (inv.signature2Strokes ?? null);
    set.signature2AssetId = null;
    set.signature2Strokes = null;
  }

  if (extras.paletteId !== undefined && inv.featureKeys.includes('color_choice')) {
    if (!extras.paletteId) set.colors = null;
    else if (!/^[0-9a-f-]{36}$/i.test(extras.paletteId)) errors.palette = 'invalid';
    else {
      const [p] = await db
        .select({ colors: themePalettes.colors })
        .from(themePalettes)
        .where(and(eq(themePalettes.id, extras.paletteId), eq(themePalettes.themeId, inv.themeId), eq(themePalettes.status, 'ACTIVE')));
      // Only the package's own colour sets (none chosen in Admin = all).
      if (!p || (inv.paletteIds?.length && !inv.paletteIds.includes(extras.paletteId))) errors.palette = 'invalid';
      else set.colors = p.colors;
    }
  }

  if (extras.stickerShape !== undefined && inv.featureKeys.includes('sticker')) {
    if (extras.stickerShape === 'round' || extras.stickerShape === 'square' || extras.stickerShape === 'both') set.stickerShape = extras.stickerShape;
    else errors.stickerShape = 'invalid';
  }

  if (extras.cardChoices !== undefined && inv.featureKeys.some((k) => (Object.values(CARD_SHAPE_FEATURES) as string[]).includes(k))) {
    const picked = [...new Set(extras.cardChoices)];
    const valid = picked.every((k) => k === MAIN_CARD || (inv.cardShapes?.includes(k) && shapeIncluded(inv.featureKeys, k)));
    if (!picked.length) errors.cardChoices = 'required';
    else if (!valid) errors.cardChoices = 'invalid';
    else set.cardChoices = chosenCards(inv.featureKeys, picked, inv.cardShapes ?? []);
  }

  if (extras.bottleSize !== undefined && inv.featureKeys.includes('bottle_label')) {
    if (isBottleSize(extras.bottleSize)) set.bottleSize = extras.bottleSize;
    else errors.bottleSize = 'invalid';
  }

  if (inv.fieldKeys?.includes('birth_date')) {
    const style = extras.birthDateStyle;
    const digits = extras.birthDateDigits;
    if (style !== undefined) {
      if ((BIRTH_DATE_STYLES as readonly string[]).includes(style)) set.birthDateStyle = style as InvitationRow['birthDateStyle'];
      else errors.birthDateStyle = 'invalid';
    }
    if (digits !== undefined) {
      if ((BIRTH_DATE_DIGITS as readonly string[]).includes(digits)) set.birthDateDigits = digits as InvitationRow['birthDateDigits'];
      else errors.birthDateStyle = 'invalid';
    }
  }

  if (extras.wording && inv.wordingLines?.length) {
    const next: Record<string, string> = { ...(inv.wording ?? {}) };
    for (const line of inv.wordingLines) {
      const pick = extras.wording[line.key];
      if (!pick) continue;
      const version = inv.locale && inv.locale !== 'ar' ? line.versions?.[inv.locale] : undefined;
      const text = cleanLine(pick.text);
      const fallback = wordingDefault(line, inv.locale ?? 'ar');
      const keep = (value: string) => (value === fallback ? delete next[line.key] : (next[line.key] = value));
      const option = /^opt:(\d+)$/.exec(pick.choice);
      if (pick.choice === 'ar') keep(line.ar);
      else if (option && line.options?.[Number(option[1])] !== undefined) keep(line.options[Number(option[1])]!);
      else if (pick.choice === 'lang' && version) keep(version);
      else if (pick.choice === 'custom' && line.custom === false) errors[`w.${line.key}`] = 'invalidChoice';
      else if (pick.choice === 'custom' && !text) errors[`w.${line.key}`] = 'required';
      else if (pick.choice === 'custom' && text.length > themeTextLimit(design?.key, `wording.${line.key}`, line.maxLength) && text !== inv.wording?.[line.key]) errors[`w.${line.key}`] = 'tooLong';
      else if (pick.choice === 'custom' && /[<>]/.test(text)) errors[`w.${line.key}`] = 'invalidText';
      else if (pick.choice === 'custom') next[line.key] = text;
      else errors[`w.${line.key}`] = 'invalidChoice';
    }
    set.wording = next;
  }

  if (extras.switches && inv.switchDefs?.length) {
    const next: Record<string, boolean> = { ...(inv.switches ?? {}) };
    for (const def of inv.switchDefs) {
      const on = extras.switches[def.key];
      if (on === undefined) continue;
      if (on === def.default) delete next[def.key];
      else next[def.key] = on;
    }
    set.switches = next;
  }

  if (Object.keys(errors).length) throw new OrderError('invalidFields', errors);
  return set;
}

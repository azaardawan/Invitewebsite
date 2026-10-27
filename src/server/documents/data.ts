import 'server-only';
import { MAIN_CARD, chosenCards } from '@/catalog/features';
import { themeBorder } from '@/server/catalog/border';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import QRCode from 'qrcode';
import type { DbOrTx } from '@/server/db/client';
import { guestResponses, invitations, themeVersions } from '@/server/db/schema';
import { buildThemeProps, invitationMessages } from '@/server/invitation/theme-props';
import { manifestByCodeRef } from '@/theme-registry';
import type { CardShape, ThemeManifest } from '@/theme-sdk/manifest';
import { env } from '@/server/env';
import { invitationPath } from '@/lib/ids';
import type { KeepsakeMessage, KeepsakeProps, PrintCardBackProps, PrintCardProps, PrintLabels } from '@/theme-sdk/print';
import type { Locale } from '@/i18n/config';
import { occasionKey, signatureUrls } from '@/server/invitation/load';
import { listPhotos } from '@/server/photos/photos';
import type { RenderKind } from './tokens';
import type { CardOptions } from '@/server/db/schema';
import type { ThemeProps } from '@/theme-sdk/types';
import { defaultLook, themeArtwork, type ResolvedCardDesign } from '@/server/catalog/card-design';
import type { ExtrasLook } from '@/server/db/schema';
import { tintedLook } from '@/components/print/look';

type InvitationRow = typeof invitations.$inferSelect;
type PrintMessages = { scanToOpen: string; keepsakeTitle: string; keepsakeEmpty: string; cardBackTitle: string; watermark: string; watermarkNote: string };

/**
 * Page size for Chromium. The card page is exactly the trim size (A5 = 148 × 210 mm) and the theme's
 * bleed is cropped off (`cropMm`); the print-shop version keeps the bleed. The keepsake is A4.
 */
export type PageSpec = { width: string; height: string; margin: string; cropMm: number };

const CARD_SIZES = { A5: [148, 210], '5x7': [127, 178] } as const;

export function invitationUrl(inv: Pick<InvitationRow, 'slug' | 'publicId'>): string {
  return `${env().APP_URL.replace(/\/$/, '')}${invitationPath(inv.slug, inv.publicId)}`;
}

export async function visibleMessages(db: DbOrTx, invitationId: string, locale: Locale): Promise<KeepsakeMessage[]> {
  const rows = (await db
    .select({ name: guestResponses.guestName, message: guestResponses.message, attendance: guestResponses.attendance })
    .from(guestResponses)
    .where(and(eq(guestResponses.invitationId, invitationId), eq(guestResponses.messageStatus, 'VISIBLE'), isNotNull(guestResponses.message)))
    .orderBy(asc(guestResponses.createdAt), asc(guestResponses.id))) as { name: string; message: string; attendance: 'ATTENDING' | 'NOT_ATTENDING' }[];
  // Whether each guest is coming, printed beside their name so the couple sees it with the message.
  const labels = invitationMessages(locale) as unknown as { guestComing: string; guestNotComing: string };
  return rows.map((r) => {
    const attending = r.attendance === 'ATTENDING';
    return { name: r.name, message: r.message, attending, guestName: `${r.name} · ${attending ? labels.guestComing : labels.guestNotComing}` };
  });
}

/** The design's shaped cards (manifest `print.shapes`), from the invitation's version, else the registry. */
function designShapes(versionManifest: unknown, manifest: ThemeManifest | undefined): CardShape[] {
  return (versionManifest as ThemeManifest | null)?.print?.shapes ?? manifest?.print?.shapes ?? [];
}

/** The printed cards an invitation gets (`a5` and/or shape keys), in order, with each shape's details; the first is its main card. */
export async function invitationCardDetails(db: DbOrTx, inv: Pick<InvitationRow, 'themeVersionId' | 'featureKeys' | 'cardChoices'>) {
  const [version] = await db.select({ codeRef: themeVersions.codeRef, manifest: themeVersions.manifest }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
  const shapes = version ? designShapes(version.manifest, manifestByCodeRef(version.codeRef)) : [];
  return chosenCards(inv.featureKeys, inv.cardChoices, shapes.map((x) => x.key)).map((key) => ({ key, shape: shapes.find((x) => x.key === key) ?? null }));
}

/** The printed cards an invitation gets (`a5` and/or shape keys), in order; the first is its main card. */
export async function invitationCards(db: DbOrTx, inv: Pick<InvitationRow, 'themeVersionId' | 'featureKeys' | 'cardChoices'>) {
  return (await invitationCardDetails(db, inv)).map((c) => c.key);
}

/**
 * Everything a theme's print component and the PDF page need for one invitation. `card`: which of the customer's
 * printed cards (`a5` or a shape key); left out or not one of theirs, their first.
 */
export async function printData(db: DbOrTx, inv: InvitationRow, kind: RenderKind, pick: { card?: string | null } = {}) {
  const [version] = await db.select({ codeRef: themeVersions.codeRef, manifest: themeVersions.manifest }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
  const codeRef = version!.codeRef;
  const manifest = manifestByCodeRef(codeRef);
  const theme = buildThemeProps({
    mode: 'live',
    locale: inv.locale,
    fieldKeys: inv.fieldKeys,
    features: inv.featureKeys,
    values: inv.fieldValues,
    musicSrc: null,
    border: await themeBorder(db, inv.themeId),
    signatureSrcs: await signatureUrls(db, inv),
    colorSlots: (version!.manifest as ThemeManifest | null)?.colors?.slots ?? manifest?.colors?.slots ?? [],
    colors: inv.colors,
    occasion: await occasionKey(db, inv.sectionId),
    birthDateFormat: { style: inv.birthDateStyle, digits: inv.birthDateDigits },
    wordingLines: (version!.manifest as ThemeManifest | null)?.wording ?? manifest?.wording ?? [],
    wording: inv.wording,
    switchDefs: (version!.manifest as ThemeManifest | null)?.switches ?? manifest?.switches ?? [],
    switches: inv.switches,
    // Printed: the full size of each photo.
    photos: inv.featureKeys.includes('photos') ? (await listPhotos(db, inv.id)).map((p) => ({ ...p, src: p.fullSrc })) : [],
    photoSpec: (version!.manifest as ThemeManifest | null)?.photos ?? manifest?.photos ?? null,
  });

  if (kind === 'card' || kind === 'cardBleed') {
    const opts = inv.cardOptions ?? {};
    // A design without an online invitation has nothing for a QR code to open.
    const qrUrl = opts.showQr !== false && manifest?.onlineInvitation !== false ? invitationUrl(inv) : null;
    const artwork = await themeArtwork(db, inv.themeId);
    // Which of the customer's cards: the A5 card or one of the shaped cards they ticked (only while the package includes it).
    const shapes = designShapes(version!.manifest, manifest);
    const cards = chosenCards(inv.featureKeys, inv.cardChoices, shapes.map((x) => x.key));
    const card = pick.card && cards.includes(pick.card) ? pick.card : cards[0]!;
    const shape = card === MAIN_CARD ? null : (shapes.find((x) => x.key === card) ?? null);
    return { codeRef, ...(await cardData(theme, manifest, kind, opts, qrUrl, { front: artwork.front, back: artwork.back }, artwork.look, shape)) };
  }
  const { base } = printBase(theme);
  const props: KeepsakeProps = { ...base, messages: await visibleMessages(db, inv.id, inv.locale) };
  return { codeRef, kind: 'keepsake' as const, props, page: { width: '210mm', height: '297mm', margin: '0', cropMm: 0 } satisfies PageSpec };
}

/** The props every print design shares, from the invitation's theme props. */
function printBase(theme: ThemeProps) {
  const { cardBackTitle, scanToOpen, keepsakeTitle, keepsakeEmpty } = (invitationMessages(theme.locale) as unknown as { print: PrintMessages }).print;
  const labels: PrintLabels = {
    date: theme.labels.date,
    time: theme.labels.time,
    venue: theme.labels.venue,
    and: theme.labels.and,
    scanToOpen,
    keepsakeTitle,
    keepsakeEmpty,
    itsABoy: theme.labels.itsABoy,
    itsAGirl: theme.labels.itsAGirl,
    bornOn: theme.labels.bornOn,
  };
  const base = {
    locale: theme.locale,
    dir: theme.dir,
    lang: theme.lang,
    fields: theme.fields,
    event: { date: theme.event.date, time: theme.event.time },
    labels,
    border: theme.border,
    signatures: theme.signatures,
    colors: theme.colors,
    birthDate: theme.birthDate,
    wording: theme.wording,
    switches: theme.switches,
    occasion: theme.occasion,
    photos: theme.photos,
  };
  return { base, cardBackTitle };
}

/**
 * Both sides of the printable card: page sizes, the front's and back's props, and the owner's artwork for
 * either side (Admin → Themes → Printable card design), which replaces the theme's own design for that side.
 */
export async function cardData(
  theme: ThemeProps,
  manifest: ThemeManifest | undefined,
  kind: 'card' | 'cardBleed',
  opts: CardOptions,
  qrUrl: string | null,
  design: ResolvedCardDesign,
  /** The owner's look for this design's extras; the platform's simple card front and back follow it too. */
  ownerLook: ExtrasLook | null = null,
  /** The shaped card (leaf, heart…) this file is for, or null for the A5 card. */
  shape: CardShape | null = null,
) {
  const { base, cardBackTitle } = printBase(theme);
  const spec = manifest?.print?.card ?? { size: 'A5' as const, bleedMm: 3, qr: true };
  const [w, h] = CARD_SIZES[spec.size];
  // In the design's colours when it sets them (scanners read any strong contrast), otherwise black on white.
  const qrDataUrl = spec.qr && qrUrl ? await QRCode.toDataURL(qrUrl, { margin: 0, width: 384, errorCorrectionLevel: 'M', ...(spec.qrColors ? { color: spec.qrColors } : {}) }) : null;
  // Card-only wording from Admin: replace (or remove) the message, add one extra line.
  const fields = { ...base.fields };
  if (opts.message !== undefined) {
    if (opts.message.trim()) fields.invitation_message = opts.message.trim();
    else delete fields.invitation_message;
  }
  const props: PrintCardProps = { ...base, fields, qrDataUrl, extraLine: opts.extraLine?.trim() || null };
  // The back: the customer's big title (or a default) and smaller message.
  const back: PrintCardBackProps = { ...base, title: opts.backTitle?.trim() || cardBackTitle, message: opts.backMessage?.trim() || null, qrDataUrl };
  const page: PageSpec =
    kind === 'card'
      ? { width: `${w}mm`, height: `${h}mm`, margin: '0', cropMm: spec.bleedMm }
      : { width: `${w + 2 * spec.bleedMm}mm`, height: `${h + 2 * spec.bleedMm}mm`, margin: '0', cropMm: 0 };
  // The back is landscape: the same card turned sideways (A5 → 210 × 148 mm).
  const backPage: PageSpec = { ...page, width: page.height, height: page.width };
  const sheet = { bleedMm: spec.bleedMm, pageHasBleed: kind === 'cardBleed' };
  const gender = base.fields.baby_gender === 'boy' || base.fields.baby_gender === 'girl' ? base.fields.baby_gender : null;
  const look = tintedLook(ownerLook ?? defaultLook(base.colors), gender);
  return { kind: 'card' as const, props, back, page, backPage, design, sheet, look, shape: shape ? shapeSheet(shape, kind) : null };
}

/** Around a shaped card on its PDF page: room for the print shop to handle it (the cut line runs around the shape). */
export const SHAPE_MARGIN_MM = 10;

/**
 * A shaped card's two sides: each side's box, cut line and page (with a margin around the shape). The back's cut
 * line is the front's mirrored (the card turned over); with `backSideways` the card is also turned a quarter
 * (the front's top on the left), which is the front's outline with x and y swapped. `cutLine`: the print-shop
 * file draws the cut line.
 */
export function shapeSheet(shape: CardShape, kind: 'card' | 'cardBleed') {
  const front = { widthMm: shape.widthMm, heightMm: shape.heightMm, outline: shape.outline };
  const back = shape.backSideways
    ? { widthMm: shape.heightMm, heightMm: shape.widthMm, outline: transposePath(shape.outline) }
    : { widthMm: shape.widthMm, heightMm: shape.heightMm, outline: mirrorPath(shape.outline, shape.widthMm) };
  const page = (b: { widthMm: number; heightMm: number }) => ({ width: `${b.widthMm + 2 * SHAPE_MARGIN_MM}mm`, height: `${b.heightMm + 2 * SHAPE_MARGIN_MM}mm` });
  return {
    key: shape.key,
    sides: { front: { ...front, page: page(front) }, back: { ...back, page: page(back) } },
    cutLine: kind === 'cardBleed',
  };
}

/** An outline with x and y swapped: mirrored and turned a quarter (the top goes to the left). */
export function transposePath(d: string): string {
  return d.replace(/(-?\d+(?:\.\d+)?)([\s,]+)(-?\d+(?:\.\d+)?)/g, (_, x, sep, y) => `${y}${sep}${x}`);
}

/** An outline (absolute M/L/C/Q/Z commands, x y pairs) mirrored left-right within a box `width` wide. */
export function mirrorPath(d: string, width: number): string {
  let i = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (n) => (i++ % 2 === 0 ? String(Math.round((width - Number(n)) * 100) / 100) : n));
}

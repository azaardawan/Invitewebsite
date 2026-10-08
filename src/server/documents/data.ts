import 'server-only';
import { themeBorder } from '@/server/catalog/border';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import QRCode from 'qrcode';
import type { DbOrTx } from '@/server/db/client';
import { guestResponses, invitations, themeVersions } from '@/server/db/schema';
import { buildThemeProps, invitationMessages } from '@/server/invitation/theme-props';
import { manifestByCodeRef } from '@/theme-registry';
import type { ThemeManifest } from '@/theme-sdk/manifest';
import { env } from '@/server/env';
import { invitationPath } from '@/lib/ids';
import type { KeepsakeProps, PrintCardBackProps, PrintCardProps, PrintLabels } from '@/theme-sdk/print';
import { signatureUrls } from '@/server/invitation/load';
import type { RenderKind } from './tokens';
import type { CardOptions } from '@/server/db/schema';
import type { ThemeProps } from '@/theme-sdk/types';
import { themeCardDesign, type ResolvedCardDesign } from '@/server/catalog/card-design';

type InvitationRow = typeof invitations.$inferSelect;
type PrintMessages = { scanToOpen: string; keepsakeTitle: string; keepsakeEmpty: string; cardBackTitle: string };

/**
 * Page size for Chromium. The card page is exactly the trim size (A5 = 148 × 210 mm) and the theme's
 * bleed is cropped off (`cropMm`); the print-shop version keeps the bleed. The keepsake is A4.
 */
export type PageSpec = { width: string; height: string; margin: string; cropMm: number };

const CARD_SIZES = { A5: [148, 210], '5x7': [127, 178] } as const;

export function invitationUrl(inv: Pick<InvitationRow, 'slug' | 'publicId'>): string {
  return `${env().APP_URL.replace(/\/$/, '')}${invitationPath(inv.slug, inv.publicId)}`;
}

export async function visibleMessages(db: DbOrTx, invitationId: string) {
  return db
    .select({ guestName: guestResponses.guestName, message: guestResponses.message })
    .from(guestResponses)
    .where(and(eq(guestResponses.invitationId, invitationId), eq(guestResponses.messageStatus, 'VISIBLE'), isNotNull(guestResponses.message)))
    .orderBy(asc(guestResponses.createdAt), asc(guestResponses.id)) as Promise<{ guestName: string; message: string }[]>;
}

/** Everything a theme's print component and the PDF page need for one invitation. */
export async function printData(db: DbOrTx, inv: InvitationRow, kind: RenderKind) {
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
  });

  if (kind === 'card' || kind === 'cardBleed') {
    const opts = inv.cardOptions ?? {};
    const qrUrl = opts.showQr !== false ? invitationUrl(inv) : null;
    return { codeRef, ...(await cardData(theme, manifest, kind, opts, qrUrl, await themeCardDesign(db, inv.themeId))) };
  }
  const { base } = printBase(theme);
  const props: KeepsakeProps = { ...base, messages: await visibleMessages(db, inv.id) };
  return { codeRef, kind: 'keepsake' as const, props, page: { width: '210mm', height: '297mm', margin: '0', cropMm: 0 } satisfies PageSpec };
}

/** The props every print design shares, from the invitation's theme props. */
function printBase(theme: ThemeProps) {
  const { cardBackTitle, ...printMsgs } = (invitationMessages(theme.locale) as unknown as { print: PrintMessages }).print;
  const labels: PrintLabels = { date: theme.labels.date, time: theme.labels.time, venue: theme.labels.venue, and: theme.labels.and, ...printMsgs };
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
) {
  const { base, cardBackTitle } = printBase(theme);
  const spec = manifest?.print?.card ?? { size: 'A5' as const, bleedMm: 3, qr: true };
  const [w, h] = CARD_SIZES[spec.size];
  const qrDataUrl = spec.qr && qrUrl ? await QRCode.toDataURL(qrUrl, { margin: 0, width: 384, errorCorrectionLevel: 'M' }) : null;
  // Card-only wording from Admin: replace (or remove) the message, add one extra line.
  const fields = { ...base.fields };
  if (opts.message !== undefined) {
    if (opts.message.trim()) fields.invitation_message = opts.message.trim();
    else delete fields.invitation_message;
  }
  const props: PrintCardProps = { ...base, fields, qrDataUrl, extraLine: opts.extraLine?.trim() || null };
  // The back: the customer's big title (or a default) and smaller message.
  const back: PrintCardBackProps = { ...base, title: opts.backTitle?.trim() || cardBackTitle, message: opts.backMessage?.trim() || null };
  const page: PageSpec =
    kind === 'card'
      ? { width: `${w}mm`, height: `${h}mm`, margin: '0', cropMm: spec.bleedMm }
      : { width: `${w + 2 * spec.bleedMm}mm`, height: `${h + 2 * spec.bleedMm}mm`, margin: '0', cropMm: 0 };
  // The back is landscape: the same card turned sideways (A5 → 210 × 148 mm).
  const backPage: PageSpec = { ...page, width: page.height, height: page.width };
  const sheet = { bleedMm: spec.bleedMm, pageHasBleed: kind === 'cardBleed' };
  return { kind: 'card' as const, props, back, page, backPage, design, sheet };
}

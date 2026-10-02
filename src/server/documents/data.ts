import 'server-only';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import QRCode from 'qrcode';
import type { DbOrTx } from '@/server/db/client';
import { guestResponses, invitations, themeVersions } from '@/server/db/schema';
import { buildThemeProps, invitationMessages } from '@/server/invitation/theme-props';
import { manifestByCodeRef } from '@/theme-registry';
import { env } from '@/server/env';
import { invitationPath } from '@/lib/ids';
import type { KeepsakeProps, PrintCardProps, PrintLabels } from '@/theme-sdk/print';
import type { RenderKind } from './tokens';

type InvitationRow = typeof invitations.$inferSelect;
type PrintMessages = { scanToOpen: string; keepsakeTitle: string; keepsakeEmpty: string };

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
  const [version] = await db.select({ codeRef: themeVersions.codeRef }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
  const codeRef = version!.codeRef;
  const manifest = manifestByCodeRef(codeRef);
  const theme = buildThemeProps({ mode: 'live', locale: inv.locale, fieldKeys: inv.fieldKeys, features: inv.featureKeys, values: inv.fieldValues, musicSrc: null });
  const msgs = invitationMessages(inv.locale) as unknown as { print: PrintMessages };
  const labels: PrintLabels = { date: theme.labels.date, time: theme.labels.time, venue: theme.labels.venue, and: theme.labels.and, ...msgs.print };
  const base = { locale: theme.locale, dir: theme.dir, lang: theme.lang, fields: theme.fields, event: { date: theme.event.date, time: theme.event.time }, labels };

  if (kind === 'card' || kind === 'cardBleed') {
    const spec = manifest?.print?.card ?? { size: 'A5' as const, bleedMm: 3, qr: true };
    const [w, h] = CARD_SIZES[spec.size];
    const opts = inv.cardOptions ?? {};
    const showQr = spec.qr && opts.showQr !== false;
    const qrDataUrl = showQr ? await QRCode.toDataURL(invitationUrl(inv), { margin: 0, width: 384, errorCorrectionLevel: 'M' }) : null;
    // Card-only wording from Admin: replace (or remove) the message, add one extra line.
    const fields = { ...base.fields };
    if (opts.message !== undefined) {
      if (opts.message.trim()) fields.invitation_message = opts.message.trim();
      else delete fields.invitation_message;
    }
    const props: PrintCardProps = { ...base, fields, qrDataUrl, extraLine: opts.extraLine?.trim() || null };
    const page: PageSpec =
      kind === 'card'
        ? { width: `${w}mm`, height: `${h}mm`, margin: '0', cropMm: spec.bleedMm }
        : { width: `${w + 2 * spec.bleedMm}mm`, height: `${h + 2 * spec.bleedMm}mm`, margin: '0', cropMm: 0 };
    return { codeRef, kind: 'card' as const, props, page };
  }
  const props: KeepsakeProps = { ...base, messages: await visibleMessages(db, inv.id) };
  return { codeRef, kind: 'keepsake' as const, props, page: { width: '210mm', height: '297mm', margin: '0 (cover) · 18mm 16mm 20mm', cropMm: 0 } satisfies PageSpec };
}

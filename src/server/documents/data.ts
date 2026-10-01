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
import type { DocumentKind } from './tokens';

type InvitationRow = typeof invitations.$inferSelect;
type PrintMessages = { scanToOpen: string; keepsakeTitle: string; keepsakeEmpty: string };

/** Page size for Chromium, from the theme manifest (A5/5×7 plus bleed for the card, A4 for the keepsake). */
export type PageSpec = { width: string; height: string; margin: string };

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
export async function printData(db: DbOrTx, inv: InvitationRow, kind: DocumentKind) {
  const [version] = await db.select({ codeRef: themeVersions.codeRef }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
  const codeRef = version!.codeRef;
  const manifest = manifestByCodeRef(codeRef);
  const theme = buildThemeProps({ mode: 'live', locale: inv.locale, fieldKeys: inv.fieldKeys, features: inv.featureKeys, values: inv.fieldValues, musicSrc: null });
  const msgs = invitationMessages(inv.locale) as unknown as { print: PrintMessages };
  const labels: PrintLabels = { date: theme.labels.date, time: theme.labels.time, venue: theme.labels.venue, ...msgs.print };
  const base = { locale: theme.locale, dir: theme.dir, lang: theme.lang, fields: theme.fields, event: { date: theme.event.date, time: theme.event.time }, labels };

  if (kind === 'card') {
    const spec = manifest?.print?.card ?? { size: 'A5' as const, bleedMm: 3, qr: true };
    const [w, h] = CARD_SIZES[spec.size];
    const qrDataUrl = spec.qr ? await QRCode.toDataURL(invitationUrl(inv), { margin: 0, width: 384, errorCorrectionLevel: 'M' }) : null;
    const props: PrintCardProps = { ...base, qrDataUrl };
    return { codeRef, kind, props, page: { width: `${w + 2 * spec.bleedMm}mm`, height: `${h + 2 * spec.bleedMm}mm`, margin: '0' } satisfies PageSpec };
  }
  const props: KeepsakeProps = { ...base, messages: await visibleMessages(db, inv.id) };
  return { codeRef, kind, props, page: { width: '210mm', height: '297mm', margin: '20mm 16mm' } satisfies PageSpec };
}

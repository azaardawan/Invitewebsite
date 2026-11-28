import 'server-only';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { guestResponses, invitations } from '@/server/db/schema';
import { themeBoard } from '@/server/catalog/card-design';
import { getSettings } from '@/server/settings/service';
import { occasionKey } from '@/server/invitation/load';
import { invitationMessages } from '@/server/invitation/theme-props';
import { eventWords } from '@/catalog/occasion-wording';
import { BOARD_INKS, boardSection, parseArrangement } from '@/catalog/signature-board';
import { signatureDrawing, type SignatureStrokes } from '@/lib/signature-strokes';
import type { BoardView } from '@/components/board/types';

type InvitationRow = typeof invitations.$inferSelect;

/** Whether a design can be sold with the board: a wedding or newborn design whose board artwork the owner uploaded. */
export async function boardOffered(db: DbOrTx, themeId: string, sectionKey: string | null | undefined) {
  if (!boardSection(sectionKey)) return false;
  return (await themeBoard(db, themeId)) !== null;
}

/** The board's notes: every visible guest message, in the order they came, with the guest's name and signature. */
export async function boardNotes(db: DbOrTx, invitationId: string) {
  const rows = await db
    .select({ id: guestResponses.id, name: guestResponses.guestName, message: guestResponses.message, signature: guestResponses.signature })
    .from(guestResponses)
    .where(and(eq(guestResponses.invitationId, invitationId), eq(guestResponses.messageStatus, 'VISIBLE'), isNotNull(guestResponses.message)))
    .orderBy(asc(guestResponses.createdAt), asc(guestResponses.id));
  return rows.map((r) => ({ id: r.id, name: r.name, message: r.message ?? '', signature: signatureDrawing(r.signature as SignatureStrokes | null) }));
}

/** The board's heading: the couple's (or the baby's) names and the keepsake's line, in the invitation's language. */
export function boardHeading(inv: Pick<InvitationRow, 'fieldValues' | 'locale' | 'eventKind' | 'eventName'>) {
  const msgs = invitationMessages(inv.locale) as unknown as { and: string; print: { keepsakeTitle: string } };
  const v = inv.fieldValues;
  const names = v.baby_name ? v.baby_name : [v.person_1_name, v.person_2_name].filter(Boolean).join(` ${msgs.and} `);
  const event = eventWords(inv.eventKind, inv.eventName, inv.locale);
  return { names, subtitle: event?.keepsake ?? msgs.print.keepsakeTitle };
}

/**
 * Everything the board needs (editor, print page): the artwork and its settings, the notes, how many fit on a board,
 * the saved arrangement, and the heading. Null when the invitation has no board or the design no artwork.
 */
export async function boardView(db: DbOrTx, inv: InvitationRow): Promise<BoardView | null> {
  if (!inv.signatureBoard) return null;
  const design = await themeBoard(db, inv.themeId);
  if (!design) return null;
  const [{ signatureBoard: settings }, notes, section] = await Promise.all([getSettings(db), boardNotes(db, inv.id), occasionKey(db, inv.sectionId)]);
  const rtl = inv.locale !== 'en';
  return {
    design: {
      src: design.src,
      widthMm: design.widthMm,
      heightMm: design.heightMm,
      area: design.area,
      inks: [...BOARD_INKS[design.inks]],
      title: design.title,
      titleColor: design.titleColor,
      titleFont: design.titleFont,
      font: design.font,
      keepOut: design.keepOut ?? null,
    },
    heading: design.title ? boardHeading(inv) : null,
    notes,
    perBoard: settings.perBoard,
    arrangement: parseArrangement(inv.boardArrangement),
    dir: rtl ? 'rtl' : 'ltr',
    lang: inv.locale === 'bdn' ? 'ku' : inv.locale,
    occasion: section,
  };
}

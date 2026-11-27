import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations } from '@/server/db/schema';
import { MAX_BOARDS, parseArrangement } from '@/catalog/signature-board';

/** The saved arrangement can't grow without end (each spot is a few dozen bytes). */
const MAX_BYTES = 200 * 1024;

/**
 * Saves how the couple arranged their signature board (from the receipt's editor). Only spots of the invitation's own
 * guest messages are kept; anything malformed is dropped. Returns false when the input isn't an arrangement.
 */
export async function saveBoardArrangement(db: DbOrTx, invitationId: string, raw: string, ownIds: ReadonlySet<string>): Promise<boolean> {
  if (raw.length > MAX_BYTES) return false;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return false;
  }
  const parsed = parseArrangement(value, { boards: MAX_BOARDS });
  if (!parsed) return false;
  const spots = Object.fromEntries(Object.entries(parsed.spots).filter(([id]) => ownIds.has(id)));
  await db.update(invitations).set({ boardArrangement: { ...parsed, spots } }).where(eq(invitations.id, invitationId));
  return true;
}

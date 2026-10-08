import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { extrasUpdate } from '@/server/orders/extras';
import { OrderError } from '@/server/orders/common';

/** The customer's new text for the back of their card (receipt). False when too long. Audited. */
export async function saveCustomerCardBack(db: DbOrTx, invitationId: string, back: { title: string; message: string }, ipHash: string | null) {
  return db.transaction(async (tx) => {
    const [inv] = await tx.select().from(invitations).where(eq(invitations.id, invitationId)).for('update');
    if (!inv || !inv.featureKeys.includes('print_card')) return false;
    let set;
    try {
      set = await extrasUpdate(tx, inv, { cardBack: back });
    } catch (e) {
      if (e instanceof OrderError) return false;
      throw e;
    }
    const before = { backTitle: inv.cardOptions.backTitle ?? null, backMessage: inv.cardOptions.backMessage ?? null };
    const after = { backTitle: set.cardOptions?.backTitle ?? null, backMessage: set.cardOptions?.backMessage ?? null };
    if (before.backTitle === after.backTitle && before.backMessage === after.backMessage) return true;
    await tx.update(invitations).set(set).where(eq(invitations.id, inv.id));
    await recordAudit(tx, { actorType: 'CUSTOMER', action: 'card.back_update', objectType: 'invitation', objectId: inv.id, before, after, ipHash });
    return true;
  });
}

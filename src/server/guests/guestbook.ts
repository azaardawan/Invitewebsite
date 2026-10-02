import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';

/**
 * The customer's choice: guest messages shown under the live invitation for everyone with the link,
 * or private (keepsake only, the default). Only for packages with congratulation messages. Audited
 * whether the customer (from their receipt) or an admin changes it.
 */
export async function setPublicGuestbook(
  db: DbOrTx,
  invitationId: string,
  on: boolean,
  actor: { type: 'CUSTOMER'; ipHash: string | null } | { type: 'ADMIN'; adminId: string; ipHash: string | null },
) {
  return db.transaction(async (tx) => {
    const [inv] = await tx.select().from(invitations).where(eq(invitations.id, invitationId)).for('update');
    if (!inv || !inv.featureKeys.includes('congratulations')) return false;
    if (inv.publicGuestbook === on) return true;
    await tx.update(invitations).set({ publicGuestbook: on }).where(eq(invitations.id, inv.id));
    await recordAudit(tx, {
      actorType: actor.type,
      actorAdminId: actor.type === 'ADMIN' ? actor.adminId : null,
      action: on ? 'guestbook.made_public' : 'guestbook.made_private',
      objectType: 'invitation',
      objectId: inv.id,
      before: { publicGuestbook: inv.publicGuestbook },
      after: { publicGuestbook: on },
      ipHash: actor.ipHash,
    });
    return true;
  });
}

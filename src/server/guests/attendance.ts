import 'server-only';
import { count, eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { guestResponses, invitations } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';

export type AttendanceCounts = { attending: number; notAttending: number };

/** How many guests answered "coming" and "not coming" (one answer per guest; a changed answer counts once). */
export async function attendanceCounts(db: DbOrTx, invitationId: string): Promise<AttendanceCounts> {
  const rows = await db
    .select({ attendance: guestResponses.attendance, n: count() })
    .from(guestResponses)
    .where(eq(guestResponses.invitationId, invitationId))
    .groupBy(guestResponses.attendance);
  const of = (a: 'ATTENDING' | 'NOT_ATTENDING') => rows.find((r) => r.attendance === a)?.n ?? 0;
  return { attending: of('ATTENDING'), notAttending: of('NOT_ATTENDING') };
}

/**
 * The customer's choice: the number of guests coming / not coming shown on the live invitation for
 * everyone with the link, or seen only by the customer on their receipt (the default). Only for
 * packages with the guest form (RSVP). Audited whether the customer or an admin changes it.
 */
export async function setPublicAttendance(
  db: DbOrTx,
  invitationId: string,
  on: boolean,
  actor: { type: 'CUSTOMER'; ipHash: string | null } | { type: 'ADMIN'; adminId: string; ipHash: string | null },
) {
  return db.transaction(async (tx) => {
    const [inv] = await tx.select().from(invitations).where(eq(invitations.id, invitationId)).for('update');
    if (!inv || !inv.featureKeys.includes('rsvp')) return false;
    if (inv.publicAttendance === on) return true;
    await tx.update(invitations).set({ publicAttendance: on }).where(eq(invitations.id, inv.id));
    await recordAudit(tx, {
      actorType: actor.type,
      actorAdminId: actor.type === 'ADMIN' ? actor.adminId : null,
      action: on ? 'attendance.made_public' : 'attendance.made_private',
      objectType: 'invitation',
      objectId: inv.id,
      before: { publicAttendance: inv.publicAttendance },
      after: { publicAttendance: on },
      ipHash: actor.ipHash,
    });
    return true;
  });
}

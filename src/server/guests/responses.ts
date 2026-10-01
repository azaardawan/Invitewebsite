import 'server-only';
import { asc, eq, sql } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { guestResponses, invitations } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { auditActor, type Actor } from '@/server/catalog/common';
import { consumeRateLimit } from '@/server/rate-limit';
import { isLive } from '@/server/orders/payment';
import { sha256 } from '@/lib/crypto';
import { GUEST_LIMITS, type GuestResponseInput, type GuestSubmitResult } from '@/theme-sdk/types';

/** Per visitor (IP) across all invitations, and per invitation across all visitors. */
// Mobile carriers put many users behind one address (CGNAT), so the per-IP limit stays generous.
export const GUEST_RATE_LIMITS = { perIpPerHour: 30, perInvitationPerHour: 300 } as const;

export class GuestResponseError extends Error {
  constructor(public readonly code: 'notFound') {
    super(code);
  }
}

/** Case- and spacing-insensitive form of a guest name, so "Ahmed  Ali" and "ahmed ali" are one person. */
function nameKey(name: string) {
  return name.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Stores a guest's answer from the public invitation page. Only live
 * invitations whose package includes the guest form accept answers; the
 * message is required exactly when the package has `congratulations`. The
 * same device and name updates its earlier answer; a family sharing one phone
 * can still each leave their own reply.
 */
export async function submitGuestResponse(
  db: DbOrTx,
  input: { invitationId: string; response: GuestResponseInput; ipHash: string | null; clientToken: string },
  now = new Date(),
): Promise<GuestSubmitResult> {
  const [inv] = await db
    .select({ id: invitations.id, status: invitations.status, expiresAt: invitations.expiresAt, featureKeys: invitations.featureKeys })
    .from(invitations)
    .where(eq(invitations.id, input.invitationId));
  if (!inv || !isLive(inv, now) || !inv.featureKeys.includes('rsvp')) return { ok: false, error: 'closed' };

  const withMessage = inv.featureKeys.includes('congratulations');
  const name = String(input.response.name ?? '').trim();
  const message = withMessage ? String(input.response.message ?? '').trim() : '';
  const attendance = input.response.attendance;
  if (
    !name ||
    name.length > GUEST_LIMITS.name ||
    (attendance !== 'ATTENDING' && attendance !== 'NOT_ATTENDING') ||
    (withMessage && (!message || message.length > GUEST_LIMITS.message)) ||
    input.clientToken.length < 16
  ) {
    return { ok: false, error: 'invalid' };
  }

  if (input.ipHash && !(await consumeRateLimit(db, `guest:ip:${input.ipHash}`, GUEST_RATE_LIMITS.perIpPerHour, 3600, now))) {
    return { ok: false, error: 'rateLimited' };
  }
  if (!(await consumeRateLimit(db, `guest:inv:${inv.id}`, GUEST_RATE_LIMITS.perInvitationPerHour, 3600, now))) {
    return { ok: false, error: 'rateLimited' };
  }

  const values = {
    invitationId: inv.id,
    guestName: name,
    attendance,
    message: withMessage ? message : null,
    ipHash: input.ipHash,
    // Same phone + same name = a correction (updates the earlier reply); another name on a shared phone is a new reply.
    clientTokenHash: sha256(`${input.clientToken}:${nameKey(name)}`),
  };
  await db
    .insert(guestResponses)
    .values(values)
    .onConflictDoUpdate({
      target: [guestResponses.invitationId, guestResponses.clientTokenHash],
      // A corrected message is visible again only if it wasn't hidden by the team.
      set: { guestName: values.guestName, attendance: values.attendance, message: values.message, ipHash: values.ipHash, updatedAt: now },
    });
  return { ok: true };
}

export async function listGuestResponses(db: DbOrTx, invitationId: string) {
  return db.select().from(guestResponses).where(eq(guestResponses.invitationId, invitationId)).orderBy(asc(guestResponses.createdAt));
}

export async function guestResponseCounts(db: DbOrTx, invitationId: string) {
  const [row] = await db
    .select({
      attending: sql<number>`count(*) filter (where ${guestResponses.attendance} = 'ATTENDING')::int`,
      notAttending: sql<number>`count(*) filter (where ${guestResponses.attendance} = 'NOT_ATTENDING')::int`,
    })
    .from(guestResponses)
    .where(eq(guestResponses.invitationId, invitationId));
  return { attending: row?.attending ?? 0, notAttending: row?.notAttending ?? 0 };
}

/** Hides or restores a guest message (moderation). Audited; the message text itself is not copied into the log. */
export async function setGuestMessageStatus(db: DbOrTx, id: string, status: 'VISIBLE' | 'HIDDEN', actor: Actor) {
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(guestResponses).where(eq(guestResponses.id, id)).for('update');
    if (!row) throw new GuestResponseError('notFound');
    if (row.messageStatus === status) return;
    await tx.update(guestResponses).set({ messageStatus: status }).where(eq(guestResponses.id, id));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: status === 'HIDDEN' ? 'guest_message.hide' : 'guest_message.restore',
      objectType: 'guest_response',
      objectId: id,
      before: { messageStatus: row.messageStatus, invitationId: row.invitationId },
      after: { messageStatus: status, invitationId: row.invitationId },
    });
  });
}

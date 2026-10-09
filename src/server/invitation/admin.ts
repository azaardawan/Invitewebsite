import 'server-only';
import { and, desc, eq, gt, ilike, lte, or, sql, type SQL } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations, musicTracks, orders, packages, sections, themes } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { auditActor, type Actor } from '@/server/catalog/common';
import { fieldDefs } from '@/server/orders/common';
import { validateFieldValues } from '@/server/orders/validation';
import { slugFromNames } from '@/lib/ids';

export class InvitationAdminError extends Error {
  constructor(
    public readonly code: 'notFound' | 'stale' | 'notPublished' | 'notUnpublished' | 'invalidFields' | 'reason' | 'days' | 'music',
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(code);
  }
}

export type InvitationStatus = (typeof invitations.$inferSelect)['status'];
/** How the admin list groups invitations; "expired" is derived from the date, never stored. */
export type InvitationFilter = 'live' | 'expired' | 'unpublished' | 'awaiting' | 'draft';

export async function listInvitations(db: DbOrTx, f: { q?: string; filter?: InvitationFilter; limit?: number } = {}, now = new Date()) {
  const where: SQL[] = [];
  if (f.filter === 'live') where.push(and(eq(invitations.status, 'PUBLISHED'), gt(invitations.expiresAt, now))!);
  if (f.filter === 'expired') where.push(and(eq(invitations.status, 'PUBLISHED'), lte(invitations.expiresAt, now))!);
  if (f.filter === 'unpublished') where.push(eq(invitations.status, 'UNPUBLISHED'));
  if (f.filter === 'awaiting') where.push(eq(invitations.status, 'AWAITING_PAYMENT'));
  if (f.filter === 'draft') where.push(eq(invitations.status, 'DRAFT'));
  if (f.q) {
    const q = `%${f.q.replace(/[%_\\]/g, '\\$&')}%`;
    where.push(or(ilike(invitations.publicId, q), ilike(invitations.slug, q), sql`${invitations.fieldValues}::text ilike ${q}`, ilike(orders.orderNumber, q))!);
  }
  return db
    .select({ invitation: invitations, themeName: themes.name, packageName: packages.name, orderNumber: orders.orderNumber, orderStatus: orders.status })
    .from(invitations)
    .innerJoin(themes, eq(themes.id, invitations.themeId))
    .innerJoin(packages, eq(packages.id, invitations.packageId))
    .leftJoin(orders, and(eq(orders.invitationId, invitations.id), sql`${orders.status} in ('PENDING','AWAITING_PAYMENT','PAID')`))
    .where(where.length ? and(...where) : sql`${invitations.status} <> 'DRAFT'`)
    .orderBy(desc(invitations.createdAt))
    .limit(f.limit ?? 50);
}

export async function getInvitation(db: DbOrTx, id: string) {
  const [row] = await db
    .select({ invitation: invitations, themeName: themes.name, themeKey: themes.key, packageName: packages.name, music: musicTracks, occasionName: sections.name })
    .from(invitations)
    .innerJoin(themes, eq(themes.id, invitations.themeId))
    .innerJoin(packages, eq(packages.id, invitations.packageId))
    .leftJoin(musicTracks, eq(musicTracks.id, invitations.musicTrackId))
    .leftJoin(sections, eq(sections.id, invitations.sectionId))
    .where(eq(invitations.id, id));
  if (!row) return null;
  const orderRows = await db.select().from(orders).where(eq(orders.invitationId, id)).orderBy(desc(orders.createdAt));
  return { ...row, orders: orderRows };
}

async function lockFor(tx: DbOrTx, id: string, expectedVersion?: number) {
  const [inv] = await tx.select().from(invitations).where(eq(invitations.id, id)).for('update');
  if (!inv) throw new InvitationAdminError('notFound');
  if (expectedVersion !== undefined && inv.version !== expectedVersion) throw new InvitationAdminError('stale');
  return inv;
}

function requireReason(reason: string) {
  const r = reason.trim();
  if (r.length < 5 || r.length > 500) throw new InvitationAdminError('reason');
  return r;
}

/**
 * Corrects an invitation's details (customer asked for a fix). Same
 * validation as the order form, except a date that is already set may stay in
 * the past. The slug follows the names; old links redirect (the id is authoritative).
 */
export async function updateInvitationValues(
  db: DbOrTx,
  id: string,
  input: { values: Record<string, unknown>; expectedVersion: number; reason: string },
  actor: Actor,
  now = new Date(),
) {
  const reason = requireReason(input.reason);
  return db.transaction(async (tx) => {
    const inv = await lockFor(tx, id, input.expectedVersion);
    const existingDate = inv.fieldValues.event_date;
    const unchangedPastDate = typeof existingDate === 'string' && input.values.event_date === existingDate;
    const validateAt = unchangedPastDate ? new Date(`${existingDate}T00:00:00Z`) : now;
    const result = validateFieldValues(input.values, inv.fieldKeys, await fieldDefs(tx, inv.fieldKeys), validateAt < now ? validateAt : now);
    if (!result.ok) throw new InvitationAdminError('invalidFields', result.errors);
    const slug = slugFromNames([result.values.person_1_name, result.values.person_2_name]);
    await tx.update(invitations).set({ fieldValues: result.values, slug, version: inv.version + 1 }).where(eq(invitations.id, id));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'invitation.edited',
      objectType: 'invitation',
      objectId: id,
      before: { values: inv.fieldValues, slug: inv.slug },
      after: { values: result.values, slug },
      reason,
    });
    return { slug };
  });
}

/** Extends a published invitation by whole days from its current end (or from now, if it already ended). */
export async function extendInvitation(db: DbOrTx, id: string, input: { days: number; reason: string }, actor: Actor, now = new Date()) {
  const reason = requireReason(input.reason);
  if (!Number.isInteger(input.days) || input.days < 1 || input.days > 365) throw new InvitationAdminError('days');
  return db.transaction(async (tx) => {
    const inv = await lockFor(tx, id);
    if (!inv.publishedAt || !inv.expiresAt) throw new InvitationAdminError('notPublished');
    const from = inv.expiresAt > now ? inv.expiresAt : now;
    const expiresAt = new Date(from.getTime() + input.days * 86400_000);
    await tx.update(invitations).set({ expiresAt, version: inv.version + 1 }).where(eq(invitations.id, id));
    await recordAudit(tx, { ...auditActor(actor), action: 'invitation.extended', objectType: 'invitation', objectId: id, before: { expiresAt: inv.expiresAt }, after: { expiresAt, days: input.days }, reason });
    return { expiresAt };
  });
}

/** Takes a published invitation down (guests see the "ended" page) or puts it back. Dates are kept. */
export async function setInvitationPublished(db: DbOrTx, id: string, input: { published: boolean; reason: string }, actor: Actor) {
  const reason = requireReason(input.reason);
  return db.transaction(async (tx) => {
    const inv = await lockFor(tx, id);
    if (input.published && inv.status !== 'UNPUBLISHED') throw new InvitationAdminError('notUnpublished');
    if (!input.published && inv.status !== 'PUBLISHED') throw new InvitationAdminError('notPublished');
    const status = input.published ? 'PUBLISHED' : 'UNPUBLISHED';
    await tx.update(invitations).set({ status, version: inv.version + 1 }).where(eq(invitations.id, id));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: input.published ? 'invitation.republished' : 'invitation.unpublished',
      objectType: 'invitation',
      objectId: id,
      before: { status: inv.status },
      after: { status },
      reason,
    });
  });
}

/** Changes this one invitation's song (decision G: the theme's song change never touches existing invitations). */
export async function changeInvitationMusic(db: DbOrTx, id: string, input: { musicTrackId: string | null; reason: string }, actor: Actor) {
  const reason = requireReason(input.reason);
  return db.transaction(async (tx) => {
    const inv = await lockFor(tx, id);
    if (input.musicTrackId) {
      const [track] = await tx.select().from(musicTracks).where(eq(musicTracks.id, input.musicTrackId));
      if (!track || track.status !== 'ACTIVE') throw new InvitationAdminError('music');
    }
    await tx.update(invitations).set({ musicTrackId: input.musicTrackId, version: inv.version + 1 }).where(eq(invitations.id, id));
    await recordAudit(tx, { ...auditActor(actor), action: 'invitation.music_changed', objectType: 'invitation', objectId: id, before: { musicTrackId: inv.musicTrackId }, after: { musicTrackId: input.musicTrackId }, reason });
  });
}

/** The state shown to admins ("ended" is derived from the date). */
export function invitationState(inv: { status: InvitationStatus; expiresAt: Date | null }, now = new Date()) {
  switch (inv.status) {
    case 'PUBLISHED':
      return inv.expiresAt && inv.expiresAt > now ? ('live' as const) : ('expired' as const);
    case 'UNPUBLISHED':
      return 'unpublished' as const;
    case 'AWAITING_PAYMENT':
      return 'awaiting' as const;
    case 'PAID':
      return 'paid' as const;
    default:
      return 'draft' as const;
  }
}

export async function activeMusicTracks(db: DbOrTx) {
  return db.select({ id: musicTracks.id, title: musicTracks.title }).from(musicTracks).where(eq(musicTracks.status, 'ACTIVE')).orderBy(musicTracks.title);
}

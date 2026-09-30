import 'server-only';
import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { adminRecoveryCodes, adminUserRoles, adminUsers, roles } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { hashPassword } from '@/server/auth/password';
import { revokeUserSessions } from '@/server/auth/session';
import { randomToken } from '@/lib/crypto';

export type Actor = { adminId: string | null; ipHash: string | null; type?: 'ADMIN' | 'SYSTEM' };

export class AdminUserError extends Error {
  constructor(public readonly code: 'emailTaken' | 'unknownRole' | 'lastOwner' | 'self' | 'notFound' | 'noRoles') {
    super(code);
  }
}

function actorFields(actor: Actor) {
  return { actorType: actor.type ?? 'ADMIN', actorAdminId: actor.adminId, ipHash: actor.ipHash } as const;
}

/** A readable temporary password; the user must change it at first login. */
export function temporaryPassword() {
  return randomToken(12);
}

export async function listAdminUsers(db: DbOrTx) {
  const users = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      status: adminUsers.status,
      totpEnabledAt: adminUsers.totpEnabledAt,
      lastLoginAt: adminUsers.lastLoginAt,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.createdAt));
  const links = await db
    .select({ userId: adminUserRoles.userId, key: roles.key })
    .from(adminUserRoles)
    .innerJoin(roles, eq(roles.id, adminUserRoles.roleId));
  return users.map((u) => ({ ...u, roleKeys: links.filter((l) => l.userId === u.id).map((l) => l.key) }));
}

export async function listRoles(db: DbOrTx) {
  return db.select().from(roles).orderBy(asc(roles.createdAt));
}

async function resolveRoleIds(db: DbOrTx, roleKeys: string[]) {
  if (roleKeys.length === 0) throw new AdminUserError('noRoles');
  const rows = await db.select({ id: roles.id, key: roles.key }).from(roles).where(inArray(roles.key, roleKeys));
  if (rows.length !== new Set(roleKeys).size) throw new AdminUserError('unknownRole');
  return rows;
}

async function activeOwnerCount(db: DbOrTx, excludingUserId?: string) {
  const conditions = [eq(roles.key, 'OWNER'), eq(adminUsers.status, 'ACTIVE')];
  if (excludingUserId) conditions.push(ne(adminUsers.id, excludingUserId));
  const [row] = await db
    .select({ n: sql<number>`count(distinct ${adminUsers.id})::int` })
    .from(adminUsers)
    .innerJoin(adminUserRoles, eq(adminUserRoles.userId, adminUsers.id))
    .innerJoin(roles, eq(roles.id, adminUserRoles.roleId))
    .where(and(...conditions));
  return row?.n ?? 0;
}

export async function createAdminUser(
  db: DbOrTx,
  input: { email: string; name: string; roleKeys: string[]; password?: string },
  actor: Actor,
) {
  const email = input.email.trim();
  const password = input.password ?? temporaryPassword();
  const passwordHash = await hashPassword(password);
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(sql`lower(${adminUsers.email}) = ${email.toLowerCase()}`);
    if (existing.length) throw new AdminUserError('emailTaken');
    const roleRows = await resolveRoleIds(tx, input.roleKeys);
    const [user] = await tx
      .insert(adminUsers)
      .values({ email, name: input.name.trim(), passwordHash, mustChangePassword: true })
      .returning({ id: adminUsers.id });
    await tx.insert(adminUserRoles).values(roleRows.map((r) => ({ userId: user!.id, roleId: r.id })));
    await recordAudit(tx, {
      ...actorFields(actor),
      action: 'admin_user.created',
      objectType: 'admin_user',
      objectId: user!.id,
      after: { email, name: input.name.trim(), roles: roleRows.map((r) => r.key).sort() },
    });
    return { id: user!.id, temporaryPassword: password };
  });
}

export async function setUserRoles(db: DbOrTx, userId: string, roleKeys: string[], actor: Actor, reason?: string) {
  return db.transaction(async (tx) => {
    // Serialize role changes so two admins can't concurrently remove the last owner.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('admin_roles'))`);
    const before = await tx
      .select({ key: roles.key })
      .from(adminUserRoles)
      .innerJoin(roles, eq(roles.id, adminUserRoles.roleId))
      .where(eq(adminUserRoles.userId, userId));
    const roleRows = await resolveRoleIds(tx, roleKeys);
    const wasOwner = before.some((r) => r.key === 'OWNER');
    const staysOwner = roleRows.some((r) => r.key === 'OWNER');
    if (wasOwner && !staysOwner && (await activeOwnerCount(tx, userId)) === 0) throw new AdminUserError('lastOwner');

    await tx.delete(adminUserRoles).where(eq(adminUserRoles.userId, userId));
    await tx.insert(adminUserRoles).values(roleRows.map((r) => ({ userId, roleId: r.id })));
    await recordAudit(tx, {
      ...actorFields(actor),
      action: 'admin_user.roles_changed',
      objectType: 'admin_user',
      objectId: userId,
      before: { roles: before.map((r) => r.key).sort() },
      after: { roles: roleRows.map((r) => r.key).sort() },
      reason,
    });
  });
}

export async function setUserStatus(
  db: DbOrTx,
  userId: string,
  status: 'ACTIVE' | 'DISABLED',
  actor: Actor,
  reason?: string,
) {
  if (status === 'DISABLED' && actor.adminId === userId) throw new AdminUserError('self');
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('admin_roles'))`);
    const [user] = await tx.select().from(adminUsers).where(eq(adminUsers.id, userId));
    if (!user) throw new AdminUserError('notFound');
    if (status === 'DISABLED' && (await activeOwnerCount(tx, userId)) === 0) {
      const ownRoles = await tx
        .select({ key: roles.key })
        .from(adminUserRoles)
        .innerJoin(roles, eq(roles.id, adminUserRoles.roleId))
        .where(eq(adminUserRoles.userId, userId));
      if (ownRoles.some((r) => r.key === 'OWNER')) throw new AdminUserError('lastOwner');
    }
    await tx.update(adminUsers).set({ status }).where(eq(adminUsers.id, userId));
    if (status === 'DISABLED') await revokeUserSessions(tx, userId);
    await recordAudit(tx, {
      ...actorFields(actor),
      action: status === 'DISABLED' ? 'admin_user.disabled' : 'admin_user.enabled',
      objectType: 'admin_user',
      objectId: userId,
      before: { status: user.status },
      after: { status },
      reason,
    });
  });
}

/** Clears a user's 2FA (e.g. lost phone); they must enroll again at next sign-in. */
export async function resetUserTwoFactor(db: DbOrTx, userId: string, actor: Actor, reason?: string) {
  if (actor.adminId === userId) throw new AdminUserError('self');
  return db.transaction(async (tx) => {
    const [user] = await tx.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.id, userId));
    if (!user) throw new AdminUserError('notFound');
    await tx
      .update(adminUsers)
      .set({ totpSecretEnc: null, totpEnabledAt: null, totpLastStep: null })
      .where(eq(adminUsers.id, userId));
    await tx.delete(adminRecoveryCodes).where(eq(adminRecoveryCodes.userId, userId));
    await revokeUserSessions(tx, userId);
    await recordAudit(tx, {
      ...actorFields(actor),
      action: 'admin_user.2fa_reset',
      objectType: 'admin_user',
      objectId: userId,
      reason,
    });
  });
}

/** Issues a new temporary password (e.g. forgotten password); the user must change it. */
export async function resetUserPassword(db: DbOrTx, userId: string, actor: Actor, reason?: string) {
  if (actor.adminId === userId) throw new AdminUserError('self');
  const password = temporaryPassword();
  const passwordHash = await hashPassword(password);
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(adminUsers)
      .set({ passwordHash, mustChangePassword: true })
      .where(eq(adminUsers.id, userId))
      .returning({ id: adminUsers.id });
    if (!updated.length) throw new AdminUserError('notFound');
    await revokeUserSessions(tx, userId);
    await recordAudit(tx, {
      ...actorFields(actor),
      action: 'admin_user.password_reset',
      objectType: 'admin_user',
      objectId: userId,
      reason,
    });
  });
  return { temporaryPassword: password };
}

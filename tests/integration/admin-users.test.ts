import { beforeAll, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { adminUserRoles, auditLogs, roles } from '@/server/db/schema';
import { AdminUserError, createAdminUser, setUserRoles, setUserStatus } from '@/server/admin/users';
import { loadAuthz, can } from '@/server/rbac/authz';
import { ensureSeeded, makeAdmin } from '../helpers';

beforeAll(async () => {
  await ensureSeeded();
});

/** Leaves exactly one active OWNER (the returned one) by demoting all others. */
async function soleOwner() {
  const owner = await makeAdmin(['OWNER']);
  const [ownerRole] = await db().select().from(roles).where(eq(roles.key, 'OWNER'));
  const others = await db()
    .select({ userId: adminUserRoles.userId })
    .from(adminUserRoles)
    .where(eq(adminUserRoles.roleId, ownerRole!.id));
  for (const o of others) {
    if (o.userId !== owner.id) await setUserRoles(db(), o.userId, ['SUPPORT'], { adminId: owner.id, ipHash: null });
  }
  return owner;
}

describe('RBAC loaded from the database', () => {
  it('gives seeded roles their default permissions', async () => {
    const designer = await makeAdmin(['DESIGNER']);
    const authz = await loadAuthz(db(), designer.id);
    expect(authz.roleKeys).toEqual(['DESIGNER']);
    expect(can(authz, 'themes.manage')).toBe(true);
    expect(can(authz, 'orders.view')).toBe(false);
    expect(can(authz, 'users.manage')).toBe(false);
  });
});

describe('admin user management', () => {
  it('rejects duplicate emails regardless of case', async () => {
    const admin = await makeAdmin(['SUPPORT']);
    await expect(
      createAdminUser(db(), { email: admin.email.toUpperCase(), name: 'Dup', roleKeys: ['SUPPORT'] }, { adminId: null, ipHash: null, type: 'SYSTEM' }),
    ).rejects.toMatchObject({ code: 'emailTaken' });
  });

  it('rejects unknown roles and empty role lists', async () => {
    const actor = { adminId: null, ipHash: null, type: 'SYSTEM' as const };
    await expect(createAdminUser(db(), { email: 'x1@example.test', name: 'X', roleKeys: ['GOD'] }, actor)).rejects.toBeInstanceOf(AdminUserError);
    await expect(createAdminUser(db(), { email: 'x2@example.test', name: 'X', roleKeys: [] }, actor)).rejects.toMatchObject({ code: 'noRoles' });
  });

  it('never allows removing or disabling the last active owner', async () => {
    const owner = await soleOwner();
    const by = { adminId: owner.id, ipHash: null };
    await expect(setUserRoles(db(), owner.id, ['MANAGER'], by)).rejects.toMatchObject({ code: 'lastOwner' });
    const helper = await makeAdmin(['MANAGER']);
    await expect(setUserStatus(db(), owner.id, 'DISABLED', { adminId: helper.id, ipHash: null })).rejects.toMatchObject({
      code: 'lastOwner',
    });
    await expect(setUserStatus(db(), owner.id, 'DISABLED', by)).rejects.toMatchObject({ code: 'self' });

    // With a second owner, the first can step down.
    const second = await makeAdmin(['OWNER']);
    await setUserRoles(db(), owner.id, ['MANAGER'], { adminId: second.id, ipHash: null });
    expect((await loadAuthz(db(), owner.id)).roleKeys).toEqual(['MANAGER']);
  });

  it('audits role changes with before and after values', async () => {
    const owner = await makeAdmin(['OWNER']);
    const target = await makeAdmin(['SUPPORT']);
    await setUserRoles(db(), target.id, ['DESIGNER', 'SUPPORT'], { adminId: owner.id, ipHash: 'h' }, 'new designer');
    const [row] = await db()
      .select()
      .from(auditLogs)
      .where(sql`${auditLogs.objectId} = ${target.id} and ${auditLogs.action} = 'admin_user.roles_changed'`);
    expect(row).toMatchObject({
      actorAdminId: owner.id,
      before: { roles: ['SUPPORT'] },
      after: { roles: ['DESIGNER', 'SUPPORT'] },
      reason: 'new designer',
    });
  });
});

describe('audit log immutability', () => {
  it('rejects UPDATE, DELETE and TRUNCATE', async () => {
    await makeAdmin();
    // Drizzle wraps the Postgres error; the trigger's message is on `cause`.
    const blocked = { cause: expect.objectContaining({ message: expect.stringMatching(/append-only/) }) };
    await expect(db().execute(sql`update audit_logs set action = 'tampered'`)).rejects.toMatchObject(blocked);
    await expect(db().execute(sql`delete from audit_logs`)).rejects.toMatchObject(blocked);
    await expect(db().execute(sql`truncate audit_logs`)).rejects.toMatchObject(blocked);
  });
});

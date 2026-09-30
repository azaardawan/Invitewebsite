import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { adminUserRoles, rolePermissions, roles } from '@/server/db/schema';
import { hasPermission, type Permission } from './permissions';

export type Authz = { roleKeys: string[]; permissions: Set<string> };

export async function loadAuthz(db: DbOrTx, userId: string): Promise<Authz> {
  const rows = await db
    .select({ roleKey: roles.key, permissionKey: rolePermissions.permissionKey })
    .from(adminUserRoles)
    .innerJoin(roles, eq(roles.id, adminUserRoles.roleId))
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .where(eq(adminUserRoles.userId, userId));
  return {
    roleKeys: [...new Set(rows.map((r) => r.roleKey))],
    permissions: new Set(rows.flatMap((r) => (r.permissionKey ? [r.permissionKey] : []))),
  };
}

export function can(authz: Authz, permission: Permission) {
  return hasPermission(authz, permission);
}

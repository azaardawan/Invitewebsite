import 'server-only';
import { eq, inArray, notInArray } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { permissions, rolePermissions, roles } from '@/server/db/schema';
import { ALL_PERMISSIONS, PERMISSIONS, SYSTEM_ROLES, type SystemRoleKey } from './permissions';

/**
 * Idempotently syncs the permission catalog and the built-in roles.
 * Built-in role permissions are only set when the role is first created, so
 * later changes made by the owner in Admin are preserved.
 */
export async function seedRbac(db: DbOrTx) {
  for (const key of ALL_PERMISSIONS) {
    await db
      .insert(permissions)
      .values({ key, description: PERMISSIONS[key] })
      .onConflictDoUpdate({ target: permissions.key, set: { description: PERMISSIONS[key] } });
  }
  // Remove permissions no longer defined in code (their role links cascade).
  await db.delete(permissions).where(notInArray(permissions.key, ALL_PERMISSIONS));

  for (const [key, def] of Object.entries(SYSTEM_ROLES) as [SystemRoleKey, (typeof SYSTEM_ROLES)[SystemRoleKey]][]) {
    const inserted = await db
      .insert(roles)
      .values({ key, name: def.name, isSystem: true })
      .onConflictDoNothing({ target: roles.key })
      .returning({ id: roles.id });
    const created = inserted[0];
    if (!created || def.permissions === 'ALL') continue;
    await db
      .insert(rolePermissions)
      .values(def.permissions.map((permissionKey) => ({ roleId: created.id, permissionKey })))
      .onConflictDoNothing();
  }
}

export async function roleIdsByKey(db: DbOrTx, keys: string[]) {
  if (keys.length === 0) return new Map<string, string>();
  const rows = await db.select({ id: roles.id, key: roles.key }).from(roles).where(inArray(roles.key, keys));
  return new Map(rows.map((r) => [r.key, r.id]));
}

export async function roleByKey(db: DbOrTx, key: string) {
  const [row] = await db.select().from(roles).where(eq(roles.key, key));
  return row;
}

import { describe, expect, it } from 'vitest';
import { ALL_PERMISSIONS, SYSTEM_ROLES, hasPermission } from '@/server/rbac/permissions';

describe('permission checks', () => {
  it('OWNER holds every permission, even ones not in its stored set', () => {
    for (const p of ALL_PERMISSIONS) expect(hasPermission({ roleKeys: ['OWNER'], permissions: new Set() }, p)).toBe(true);
  });

  it('other roles hold only what they were granted', () => {
    const support = SYSTEM_ROLES.SUPPORT.permissions as string[];
    const granted = { roleKeys: ['SUPPORT'], permissions: new Set(support) };
    expect(hasPermission(granted, 'invitations.view')).toBe(true);
    expect(hasPermission(granted, 'users.manage')).toBe(false);
    expect(hasPermission(granted, 'payments.override')).toBe(false);
  });

  it('only OWNER can manage users or override payments by default', () => {
    for (const [key, role] of Object.entries(SYSTEM_ROLES)) {
      if (key === 'OWNER') continue;
      expect(role.permissions).not.toContain('users.manage');
      expect(role.permissions).not.toContain('payments.override');
    }
  });
});

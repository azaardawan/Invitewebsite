/**
 * The permission catalog is defined in code because each permission guards
 * code paths. Roles (and which permissions they hold) live in the database so
 * the owner can shape employee roles later without a deploy.
 *
 * Adding a permission: add it here, then run `pnpm db:seed` (idempotent).
 */
export const PERMISSIONS = {
  'dashboard.view': 'View the admin dashboard',
  'sections.manage': 'Create, edit, reorder and archive sections',
  'themes.view': 'View themes, versions and previews',
  'themes.manage': 'Configure themes, fields, packages and prices',
  'themes.activate': 'Change theme lifecycle state (activate, archive, restore)',
  'music.manage': 'Upload and assign music',
  'invitations.view': 'View invitations',
  'invitations.edit': 'Edit invitation information',
  'invitations.publish': 'Publish, unpublish and manually publish invitations',
  'invitations.extend': 'Extend invitation expiration',
  'orders.view': 'View orders, invoices and receipts',
  'payments.view': 'View payment records and webhook history',
  'payments.override': 'Record manual payment/publication overrides',
  'customers.view': 'View customer contact information',
  'guests.view': 'View guest responses (RSVP and messages)',
  'guests.moderate': 'Hide or restore guest messages',
  'documents.generate': 'Generate printable cards and keepsake PDFs',
  'translations.manage': 'Edit website translations',
  'analytics.view': 'View analytics',
  'settings.manage': 'Edit website/business settings',
  'legal.manage': 'Edit and publish legal policies',
  'users.manage': 'Manage admin users and roles',
  'audit.view': 'View audit history',
  'system.manage': 'System configuration and backups',
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export function isPermission(value: string): value is Permission {
  return Object.hasOwn(PERMISSIONS, value);
}

export type SystemRoleKey = 'OWNER' | 'MANAGER' | 'DESIGNER' | 'SUPPORT';

/**
 * Default permissions for the built-in roles. OWNER is special-cased in
 * `hasPermission` to always hold every permission, including ones added later.
 */
export const SYSTEM_ROLES: Record<
  SystemRoleKey,
  { name: { ar: string; en: string }; permissions: Permission[] | 'ALL' }
> = {
  OWNER: { name: { ar: 'المالك', en: 'Owner' }, permissions: 'ALL' },
  MANAGER: {
    name: { ar: 'مدير', en: 'Manager' },
    permissions: ALL_PERMISSIONS.filter(
      (p) => !['users.manage', 'system.manage', 'payments.override'].includes(p),
    ),
  },
  DESIGNER: {
    name: { ar: 'مصمم', en: 'Designer' },
    permissions: [
      'dashboard.view',
      'sections.manage',
      'themes.view',
      'themes.manage',
      'music.manage',
      'translations.manage',
    ],
  },
  SUPPORT: {
    name: { ar: 'دعم العملاء', en: 'Support' },
    permissions: [
      'dashboard.view',
      'themes.view',
      'invitations.view',
      'invitations.edit',
      'invitations.extend',
      'orders.view',
      'customers.view',
      'guests.view',
      'guests.moderate',
      'documents.generate',
    ],
  },
};

export function hasPermission(
  granted: { roleKeys: readonly string[]; permissions: ReadonlySet<string> },
  permission: Permission,
): boolean {
  return granted.roleKeys.includes('OWNER') || granted.permissions.has(permission);
}

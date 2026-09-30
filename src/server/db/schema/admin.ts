import { sql } from 'drizzle-orm';
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const adminUserStatus = pgEnum('admin_user_status', ['ACTIVE', 'DISABLED']);
export const adminLocale = pgEnum('admin_locale', ['ar', 'en']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    mustChangePassword: boolean('must_change_password').notNull().default(true),
    status: adminUserStatus('status').notNull().default('ACTIVE'),
    preferredLocale: adminLocale('preferred_locale').notNull().default('ar'),
    /** AES-256-GCM encrypted TOTP secret. Present but unconfirmed while enrolling. */
    totpSecretEnc: text('totp_secret_enc'),
    totpEnabledAt: timestamp('totp_enabled_at', { withTimezone: true }),
    /** Last accepted TOTP time-step; codes at or before it are rejected (replay protection). */
    totpLastStep: integer('totp_last_step'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('admin_users_email_lower_uq').on(sql`lower(${t.email})`)],
);

export const adminRecoveryCodes = pgTable(
  'admin_recovery_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    codeHash: text('code_hash').notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('admin_recovery_codes_user_idx').on(t.userId)],
);

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  name: jsonb('name_i18n').$type<{ ar: string; en: string }>().notNull(),
  /** System roles (OWNER, MANAGER, DESIGNER, SUPPORT) cannot be deleted. */
  isSystem: boolean('is_system').notNull().default(false),
  ...timestamps,
});

/** Mirror of the code-defined permission catalog (src/server/rbac/permissions.ts). */
export const permissions = pgTable('permissions', {
  key: text('key').primaryKey(),
  description: text('description').notNull(),
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionKey: text('permission_key')
      .notNull()
      .references(() => permissions.key, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionKey] })],
);

export const adminUserRoles = pgTable(
  'admin_user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
);

export const adminSessions = pgTable(
  'admin_sessions',
  {
    /** SHA-256 of the session token. The raw token only ever lives in the cookie. */
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    /** Null until the second factor is verified; such sessions are limited to the 2FA screens. */
    mfaVerifiedAt: timestamp('mfa_verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
  },
  (t) => [index('admin_sessions_user_idx').on(t.userId)],
);

export const authAttempts = pgTable(
  'auth_attempts',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    /** 'password' | 'totp' */
    kind: text('kind').notNull(),
    emailLower: text('email_lower'),
    userId: uuid('user_id'),
    ipHash: text('ip_hash'),
    success: boolean('success').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('auth_attempts_email_idx').on(t.emailLower, t.createdAt),
    index('auth_attempts_user_idx').on(t.userId, t.createdAt),
    index('auth_attempts_ip_idx').on(t.ipHash, t.createdAt),
  ],
);

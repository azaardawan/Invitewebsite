import { bigserial, index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { adminUsers } from './admin';

export const auditActorType = pgEnum('audit_actor_type', ['ADMIN', 'SYSTEM', 'WEBHOOK', 'CUSTOMER']);

/**
 * Append-only. A database trigger (see migration `audit_logs_append_only`)
 * rejects UPDATE and DELETE, and in production the application role is granted
 * INSERT/SELECT only (docs/runbooks/database-roles.md).
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    actorType: auditActorType('actor_type').notNull(),
    actorAdminId: uuid('actor_admin_id').references(() => adminUsers.id, { onDelete: 'restrict' }),
    action: text('action').notNull(),
    objectType: text('object_type').notNull(),
    objectId: text('object_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    reason: text('reason'),
    ipHash: text('ip_hash'),
  },
  (t) => [
    index('audit_logs_at_idx').on(t.at),
    index('audit_logs_object_idx').on(t.objectType, t.objectId),
    index('audit_logs_actor_idx').on(t.actorAdminId, t.at),
  ],
);

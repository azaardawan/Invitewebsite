import { sql } from 'drizzle-orm';
import { check, integer, jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { adminUsers } from './admin';

/**
 * Website/business settings as a single typed row (id = 1). The JSON shape is
 * validated by src/server/settings/schema.ts; history lives in the audit log.
 */
export const websiteSettings = pgTable(
  'website_settings',
  {
    id: integer('id').primaryKey().default(1),
    data: jsonb('data').notNull().default(sql`'{}'::jsonb`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'restrict' }),
  },
  (t) => [check('website_settings_singleton', sql`${t.id} = 1`)],
);

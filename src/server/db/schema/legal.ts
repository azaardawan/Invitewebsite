import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgEnum, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { adminUsers } from './admin';

export const legalPolicyType = pgEnum('legal_policy_type', ['TERMS', 'PRIVACY', 'REFUND', 'TERMS_NEWBORN']);
export const legalPolicyStatus = pgEnum('legal_policy_status', ['DRAFT', 'PUBLISHED']);

export type LegalContent = { ar: string; en: string; ckb?: string | null; bdn?: string | null };

/**
 * Versioned legal policies. Each type has at most one DRAFT being edited; publishing
 * freezes it (a database trigger rejects edits to published rows), and the latest
 * published version is what the website shows and what checkout records as accepted.
 */
export const legalPolicyVersions = pgTable(
  'legal_policy_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: legalPolicyType('type').notNull(),
    version: integer('version').notNull(),
    status: legalPolicyStatus('status').notNull().default('DRAFT'),
    /** Plain text with light markup (## heading, - list item, blank line = new paragraph), per language. */
    content: jsonb('content').$type<LegalContent>().notNull(),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    publishedBy: uuid('published_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('legal_policy_versions_type_version_idx').on(t.type, t.version),
    uniqueIndex('legal_policy_versions_one_draft_idx').on(t.type).where(sql`${t.status} = 'DRAFT'`),
    index('legal_policy_versions_published_idx').on(t.type, t.publishedAt),
  ],
);

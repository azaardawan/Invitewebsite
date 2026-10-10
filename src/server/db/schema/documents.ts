import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { adminUsers } from './admin';
import { themeVersions } from './catalog';
import { invitations } from './orders';

/** PDFs, pictures of their pages for the customer's receipt, and the link-preview picture (stored the same way, same freshness rule). */
export const documentKind = pgEnum('document_kind', [
  'PRINT_CARD',
  'KEEPSAKE_PDF',
  'PRINT_CARD_PREVIEW',
  'KEEPSAKE_PREVIEW',
  'PRINT_CARD_BACK_PREVIEW',
  'OG_IMAGE',
  // Newborn extras: the files the customer downloads, and the pictures they preview (watermarked until paid).
  'STORY_PNG',
  'STICKER_PDF',
  'STICKER_PNG',
  'BOTTLE_PDF',
  'BOTTLE_PNG',
  'STORY_PREVIEW',
  'STICKER_PREVIEW',
  'BOTTLE_PREVIEW',
  'CARD_DRAFT_PREVIEW',
]);

/**
 * The latest generated PDF per invitation and kind. `source_hash` covers
 * everything the PDF shows, so an edit (or a new guest message) makes the
 * stored copy stale and the next download regenerates it.
 */
export const generatedDocuments = pgTable(
  'generated_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invitationId: uuid('invitation_id')
      .notNull()
      .references(() => invitations.id, { onDelete: 'cascade' }),
    kind: documentKind('kind').notNull(),
    storageKey: text('storage_key').notNull(),
    sourceHash: text('source_hash').notNull(),
    themeVersionId: uuid('theme_version_id')
      .notNull()
      .references(() => themeVersions.id, { onDelete: 'restrict' }),
    messageCount: integer('message_count'),
    byteSize: integer('byte_size').notNull(),
    generatedBy: uuid('generated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('generated_documents_invitation_kind_idx').on(t.invitationId, t.kind), index('generated_documents_generated_idx').on(t.generatedAt)],
);

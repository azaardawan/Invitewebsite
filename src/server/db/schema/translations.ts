import { pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { adminUsers } from './admin';
import { invitationLocale } from './orders';

/**
 * Website texts changed in Admin → Translations. Each row replaces one message (`receipt.keepsakeTitle`)
 * in one language, on top of the texts shipped in src/i18n/messages. Deleting the row restores the shipped text.
 */
export const uiTranslations = pgTable(
  'ui_translations',
  {
    key: text('key').notNull(),
    locale: invitationLocale('locale').notNull(),
    value: text('value').notNull(),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.key, t.locale] })],
);

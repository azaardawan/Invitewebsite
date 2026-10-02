import { check, index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { invitations } from './orders';

export const guestAttendance = pgEnum('guest_attendance', ['ATTENDING', 'NOT_ATTENDING']);
export const guestMessageStatus = pgEnum('guest_message_status', ['VISIBLE', 'HIDDEN']);

/**
 * One guest form (owner decision E): name + attendance, plus a message when the
 * package has `congratulations`. The same guest name from the same device updates
 * its row (a correction); other names on a shared phone add their own rows.
 */
export const guestResponses = pgTable(
  'guest_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invitationId: uuid('invitation_id')
      .notNull()
      .references(() => invitations.id, { onDelete: 'cascade' }),
    guestName: text('guest_name').notNull(),
    attendance: guestAttendance('attendance').notNull(),
    message: text('message'),
    messageStatus: guestMessageStatus('message_status').notNull().default('VISIBLE'),
    ipHash: text('ip_hash'),
    /** SHA-256 of the per-device cookie plus the normalized guest name; never the raw token. */
    clientTokenHash: text('client_token_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('guest_responses_invitation_client_idx').on(t.invitationId, t.clientTokenHash),
    index('guest_responses_invitation_created_idx').on(t.invitationId, t.createdAt),
    check('guest_responses_name_length', sql`char_length(${t.guestName}) between 1 and 80`),
    check('guest_responses_message_length', sql`${t.message} is null or char_length(${t.message}) between 1 and 500`),
  ],
);

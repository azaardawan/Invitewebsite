import { check, index, pgEnum, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { invitations } from './orders';

export const guestAttendance = pgEnum('guest_attendance', ['ATTENDING', 'NOT_ATTENDING']);
export const guestMessageStatus = pgEnum('guest_message_status', ['VISIBLE', 'HIDDEN']);

/**
 * One guest form (owner decision E): name + attendance, plus a message when the
 * package has `congratulations`. `partySize` is how many people the reply is for (a family that got one link
 * answers once for all of them, 2026-10-28); coming / not coming totals count people. The same guest name from the same device updates
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
    partySize: smallint('party_size').notNull().default(1),
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
    check('guest_responses_party_size', sql`${t.partySize} between 1 and 20`),
    check('guest_responses_message_length', sql`${t.message} is null or char_length(${t.message}) between 1 and 500`),
  ],
);

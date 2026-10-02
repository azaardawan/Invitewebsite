import { bigserial, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Anonymous product analytics (docs/ARCHITECTURE_PROPOSAL.md §5). No IP, no names, no phone
 * numbers: only an event name, a random per-browser-session id (client events), coarse device
 * class, the referring site's host, and catalog/order ids. Raw rows are kept 13 months.
 * No foreign keys on purpose: deleting an invitation or theme never touches history.
 */
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: text('name').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    sessionId: text('session_id'),
    locale: text('locale'),
    deviceClass: text('device_class'),
    referrerHost: text('referrer_host'),
    themeId: uuid('theme_id'),
    packageId: uuid('package_id'),
    invitationId: uuid('invitation_id'),
    orderId: uuid('order_id'),
  },
  (t) => [
    index('analytics_events_name_time_idx').on(t.name, t.occurredAt),
    index('analytics_events_theme_idx').on(t.themeId, t.occurredAt),
    index('analytics_events_invitation_idx').on(t.invitationId),
  ],
);

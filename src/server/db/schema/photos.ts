import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { CoverFocus } from '../../../lib/cover-focus';
import { assets } from './catalog';
import { invitations } from './orders';

/**
 * The customer's own photos on an invitation (feature `photos`), in the design's order (`position` 0, 1, 2…).
 * Each photo has its own two image files, never shared with anything else: `asset_id` the full size (prints,
 * up to 2400 px) and `display_asset_id` a lighter one for the online invitation. `focus` is where the customer
 * placed it in the design's frame. Personal data: deleted with the invitation's other guest data (housekeeping).
 */
export const invitationPhotos = pgTable(
  'invitation_photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invitationId: uuid('invitation_id')
      .notNull()
      .references(() => invitations.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'restrict' }),
    displayAssetId: uuid('display_asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'restrict' }),
    focus: jsonb('focus').$type<CoverFocus>().notNull().default({ x: 50, y: 50, zoom: 1 }),
    /** The customer's own title and few words for this photo (template designs show them when it is opened); null = none. */
    title: text('title'),
    caption: text('caption'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('invitation_photos_position_idx').on(t.invitationId, t.position), index('invitation_photos_asset_idx').on(t.assetId)],
);

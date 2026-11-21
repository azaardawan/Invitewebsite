import { check, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
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

/**
 * The customer's further videos (designs with several screens, manifest `videos.max`; packages sell `video_limit`): place
 * 1 and 2. Place 0 is the first video, on the invitation itself (`invitations.video_asset_id`). Each is its own MP4 and
 * still, never shared. Personal data: deleted with the photos (housekeeping).
 */
export const invitationVideos = pgTable(
  'invitation_videos',
  {
    invitationId: uuid('invitation_id')
      .notNull()
      .references(() => invitations.id, { onDelete: 'cascade' }),
    place: integer('place').notNull(),
    videoAssetId: uuid('video_asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'restrict' }),
    posterAssetId: uuid('poster_asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.invitationId, t.place] }), check('invitation_videos_place_range', sql`${t.place} >= 1 and ${t.place} <= 2`)],
);

/**
 * Guests' photos (guest photo sharing, src/catalog/guest-photos.ts): each upload as the guest sent it (original quality,
 * `storage_key` under `guest-photos/`) and a small JPEG to show the couple (`thumb_key`, null when it could not be
 * drawn, e.g. an iPhone HEIC). `device_hash` is the hash of the guest's phone token (a cookie), so a phone sees and may
 * remove its own photos and is held to its share; `sha256` refuses the same photo twice. Personal data: deleted when
 * the invitation ends (housekeeping).
 */
export const guestPhotos = pgTable(
  'guest_photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invitationId: uuid('invitation_id')
      .notNull()
      .references(() => invitations.id, { onDelete: 'cascade' }),
    deviceHash: text('device_hash').notNull(),
    guestName: text('guest_name').notNull(),
    storageKey: text('storage_key').notNull(),
    thumbKey: text('thumb_key'),
    contentType: text('content_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    sha256: text('sha256').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('guest_photos_same_idx').on(t.invitationId, t.sha256), index('guest_photos_device_idx').on(t.invitationId, t.deviceHash)],
);

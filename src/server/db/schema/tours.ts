import { boolean, check, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { assets } from './catalog';

/** A tour's buttons: where each takes the visitor (empty = no button). */
export type TourLinks = { instagram?: string; location?: string; menu?: string; whatsapp?: string };

/**
 * Virtual tours (owner, 2026-11-21): a café's (or any place's) own 3D model, walked through from a link they put in
 * their Instagram bio (`/tour/<slug>`). Sold as a subscription: a tour is shown while it is `live` and before `ends_at`
 * (null = no end). The model (.glb) and the logo are assets; `visits` counts the tour's openings.
 */
export const tours = pgTable(
  'tours',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** The link's name: lowercase letters, digits and dashes (`cafe-lumiere`); unique. */
    slug: text('slug').notNull().unique(),
    /** The place's name, as it writes it. */
    name: text('name').notNull(),
    modelAssetId: uuid('model_asset_id').references(() => assets.id, { onDelete: 'set null' }),
    logoAssetId: uuid('logo_asset_id').references(() => assets.id, { onDelete: 'set null' }),
    links: jsonb('links').$type<TourLinks>().notNull().default({}),
    live: boolean('live').notNull().default(false),
    /** When the subscription ends (the tour closes by itself then); null = it doesn't end. */
    endsAt: timestamp('ends_at', { withTimezone: true }),
    /**
     * A private link (owner, 2026-11-21): when set, the tour opens only at `/tour/<slug>-<private_key>` (a random code
     * nobody can guess), never at `/tour/<slug>`. Changing the code ends the old link.
     */
    privateKey: text('private_key'),
    visits: integer('visits').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [check('tours_slug_format', sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`)],
);

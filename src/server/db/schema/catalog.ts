import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { adminUsers } from './admin';

/** Owner-entered content in the four website languages; Kurdish may be empty (falls back to Arabic). */
export type I18nContent = { ar: string; en: string; ckb?: string | null; bdn?: string | null };

export const sectionStatus = pgEnum('section_status', ['ACTIVE', 'ARCHIVED']);
export const experienceType = pgEnum('experience_type', ['INVITATION']);
export const themeStatus = pgEnum('theme_status', ['DEVELOPMENT', 'READY_FOR_REVIEW', 'ACTIVE', 'ARCHIVED']);
export const packageStatus = pgEnum('package_status', ['ACTIVE', 'ARCHIVED']);
export const musicStatus = pgEnum('music_status', ['ACTIVE', 'ARCHIVED']);
export const assetKind = pgEnum('asset_kind', ['IMAGE', 'AUDIO']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Files in object storage. Binary data never lives in the database. */
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: assetKind('kind').notNull(),
  storageKey: text('storage_key').notNull().unique(),
  mime: text('mime').notNull(),
  bytes: integer('bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  durationSeconds: integer('duration_seconds'),
  sha256: text('sha256').notNull(),
  originalFilename: text('original_filename'),
  uploadedBy: uuid('uploaded_by').references(() => adminUsers.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sections = pgTable(
  'sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Stable, URL-safe identifier (e.g. `wedding`). Never changes once created. */
    key: text('key').notNull().unique(),
    name: jsonb('name_i18n').$type<I18nContent>().notNull(),
    description: jsonb('description_i18n').$type<I18nContent>(),
    imageAssetId: uuid('image_asset_id').references(() => assets.id, { onDelete: 'restrict' }),
    status: sectionStatus('status').notNull().default('ACTIVE'),
    experienceType: experienceType('experience_type').notNull().default('INVITATION'),
    sortOrder: integer('sort_order').notNull().default(0),
    /** Features every package in this section must include (e.g. `print_card` for weddings — owner decision M). */
    requiredFeatures: text('required_features').array().notNull().default(sql`'{}'::text[]`),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('sections_order_idx').on(t.status, t.sortOrder),
    check('sections_key_format', sql`${t.key} ~ '^[a-z][a-z0-9-]{1,39}$'`),
  ],
);

/** Admin-editable settings for the code-defined Field Library (src/catalog/fields.ts). */
export const fieldDefinitions = pgTable('field_definitions', {
  key: text('key').primaryKey(),
  type: text('type').notNull(),
  label: jsonb('label_i18n').$type<I18nContent>().notNull(),
  maxLength: integer('max_length'),
  ...timestamps,
});

export const sectionDefaultFields = pgTable(
  'section_default_fields',
  {
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    fieldKey: text('field_key')
      .notNull()
      .references(() => fieldDefinitions.key, { onDelete: 'restrict' }),
    sortOrder: integer('sort_order').notNull().default(0),
    label: jsonb('label_i18n').$type<I18nContent>(),
  },
  (t) => [primaryKey({ columns: [t.sectionId, t.fieldKey] })],
);

export const musicTracks = pgTable('music_tracks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  assetId: uuid('asset_id')
    .notNull()
    .references(() => assets.id, { onDelete: 'restrict' }),
  status: musicStatus('status').notNull().default('ACTIVE'),
  ...timestamps,
});

export const themes = pgTable(
  'themes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Matches the code folder `themes/<key>/`. */
    key: text('key').notNull().unique(),
    sectionId: uuid('section_id').references(() => sections.id, { onDelete: 'restrict' }),
    name: jsonb('name_i18n').$type<I18nContent>().notNull(),
    description: jsonb('description_i18n').$type<I18nContent>(),
    status: themeStatus('status').notNull().default('DEVELOPMENT'),
    sortOrder: integer('sort_order').notNull().default(0),
    coverAssetId: uuid('cover_asset_id').references(() => assets.id, { onDelete: 'restrict' }),
    musicTrackId: uuid('music_track_id').references(() => musicTracks.id, { onDelete: 'restrict' }),
    /** The version sold to new customers. Existing invitations keep their own version. */
    currentVersionId: uuid('current_version_id').references((): AnyPgColumn => themeVersions.id, { onDelete: 'restrict' }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('themes_section_order_idx').on(t.sectionId, t.status, t.sortOrder)],
);

export const themeVersions = pgTable(
  'theme_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    themeId: uuid('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'restrict' }),
    version: integer('version').notNull(),
    /** `<key>@<version>`; how the platform finds the code for this version. */
    codeRef: text('code_ref').notNull().unique(),
    manifest: jsonb('manifest').notNull(),
    manifestHash: text('manifest_hash').notNull(),
    /** Set when the version is first activated; afterwards its manifest must never change. */
    frozenAt: timestamp('frozen_at', { withTimezone: true }),
    /** False if the code for this version is no longer in the deployed build. */
    inBuild: boolean('in_build').notNull().default(true),
    registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('theme_versions_theme_version_uq').on(t.themeId, t.version)],
);

export const themeFields = pgTable(
  'theme_fields',
  {
    themeId: uuid('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    fieldKey: text('field_key')
      .notNull()
      .references(() => fieldDefinitions.key, { onDelete: 'restrict' }),
    sortOrder: integer('sort_order').notNull().default(0),
    label: jsonb('label_i18n').$type<I18nContent>(),
  },
  (t) => [primaryKey({ columns: [t.themeId, t.fieldKey] })],
);

export const packages = pgTable(
  'packages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    themeId: uuid('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'restrict' }),
    name: jsonb('name_i18n').$type<I18nContent>().notNull(),
    description: jsonb('description_i18n').$type<I18nContent>(),
    /** Whole Iraqi dinars. */
    priceIqd: bigint('price_iqd', { mode: 'number' }).notNull(),
    /**
     * US-dollar price in cents, set by the owner (not converted from IQD).
     * Optional until card payments in USD are enabled (owner request, see architecture §2 N).
     */
    priceUsdCents: integer('price_usd_cents'),
    sortOrder: integer('sort_order').notNull().default(0),
    status: packageStatus('status').notNull().default('ACTIVE'),
    ...timestamps,
  },
  (t) => [
    index('packages_theme_idx').on(t.themeId, t.status, t.sortOrder),
    check('packages_price_range', sql`${t.priceIqd} > 0 and ${t.priceIqd} <= 100000000`),
    check('packages_price_usd_range', sql`${t.priceUsdCents} is null or (${t.priceUsdCents} > 0 and ${t.priceUsdCents} <= 10000000)`),
  ],
);

export const packageFields = pgTable(
  'package_fields',
  {
    packageId: uuid('package_id')
      .notNull()
      .references(() => packages.id, { onDelete: 'cascade' }),
    fieldKey: text('field_key')
      .notNull()
      .references(() => fieldDefinitions.key, { onDelete: 'restrict' }),
  },
  (t) => [primaryKey({ columns: [t.packageId, t.fieldKey] })],
);

export const packageFeatures = pgTable(
  'package_features',
  {
    packageId: uuid('package_id')
      .notNull()
      .references(() => packages.id, { onDelete: 'cascade' }),
    featureKey: text('feature_key').notNull(),
  },
  (t) => [primaryKey({ columns: [t.packageId, t.featureKey] })],
);

import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { adminUsers } from './admin';
import { musicTracks, packages, sections, themeVersions, themes } from './catalog';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const invitationStatus = pgEnum('invitation_status', ['DRAFT', 'AWAITING_PAYMENT', 'PAID', 'PUBLISHED', 'UNPUBLISHED']);
export const invitationLocale = pgEnum('invitation_locale', ['ar', 'en', 'ckb', 'bdn']);
export const orderStatus = pgEnum('order_status', ['PENDING', 'AWAITING_PAYMENT', 'PAID', 'CANCELLED', 'PAYMENT_EXPIRED', 'REFUNDED']);
export const historyActor = pgEnum('history_actor', ['CUSTOMER', 'SYSTEM', 'WEBHOOK', 'ADMIN']);

/** One row per order (not merged by phone: without accounts, merging would let anyone overwrite a stranger's record). */
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    phoneE164: text('phone_e164').notNull(),
    email: text('email').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('customers_phone_idx').on(t.phoneE164), index('customers_email_idx').on(t.email)],
);

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Unguessable public identifier used in `/i/<slug>-<publicId>`; authoritative (the slug is cosmetic). */
    publicId: text('public_id').notNull().unique(),
    slug: text('slug').notNull().default(''),
    themeId: uuid('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'restrict' }),
    /** Exact theme version; never migrated automatically. */
    themeVersionId: uuid('theme_version_id')
      .notNull()
      .references(() => themeVersions.id, { onDelete: 'restrict' }),
    packageId: uuid('package_id')
      .notNull()
      .references(() => packages.id, { onDelete: 'restrict' }),
    sectionId: uuid('section_id').references(() => sections.id, { onDelete: 'restrict' }),
    /** Invitation language (independent of the website language the customer browsed in). */
    locale: invitationLocale('locale').notNull(),
    /** Validated values for the package's fields, keyed by Field Library key. */
    fieldValues: jsonb('field_values').$type<Record<string, string>>().notNull(),
    /** Package fields/features at creation (the package can change later; this invitation can't). */
    fieldKeys: text('field_keys').array().notNull(),
    featureKeys: text('feature_keys').array().notNull(),
    /** Song snapshot (owner decision G): replacing a theme's song doesn't change existing invitations. */
    musicTrackId: uuid('music_track_id').references(() => musicTracks.id, { onDelete: 'restrict' }),
    status: invitationStatus('status').notNull().default('DRAFT'),
    previewTokenHash: text('preview_token_hash').unique(),
    previewExpiresAt: timestamp('preview_expires_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    /** Optimistic locking for concurrent admin edits. */
    version: integer('version').notNull().default(1),
    ...timestamps,
  },
  (t) => [
    index('invitations_status_expires_idx').on(t.status, t.expiresAt),
    check('invitations_published_consistent', sql`(${t.publishedAt} is null) = (${t.expiresAt} is null)`),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Random reference, created at checkout; used as the WAYL reference (decision C). */
    orderNumber: text('order_number').notNull().unique(),
    /** Gap-free `INV-YYYY-00001`, assigned only when payment is confirmed (decision C). */
    invoiceNumber: text('invoice_number').unique(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    invitationId: uuid('invitation_id')
      .notNull()
      .references(() => invitations.id, { onDelete: 'restrict' }),
    status: orderStatus('status').notNull().default('PENDING'),
    /** Amount charged, whole dinars. Payment is always IQD (decision N). */
    amountIqd: bigint('amount_iqd', { mode: 'number' }).notNull(),
    currency: text('currency').notNull().default('IQD'),
    /** Immutable record of what was bought, at what price. Receipts are rendered from this, never from current prices. */
    snapshot: jsonb('snapshot').notNull(),
    /** Terms/refund policy versions accepted, when, from where. */
    legalAcceptance: jsonb('legal_acceptance').notNull(),
    receiptTokenHash: text('receipt_token_hash').notNull().unique(),
    /** Client-generated key: a double-tapped "Pay" returns the same order. */
    idempotencyKey: text('idempotency_key').notNull().unique(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('orders_status_created_idx').on(t.status, t.createdAt),
    index('orders_invitation_idx').on(t.invitationId),
    // At most one open or paid order per invitation.
    uniqueIndex('orders_one_active_per_invitation')
      .on(t.invitationId)
      .where(sql`${t.status} in ('PENDING', 'AWAITING_PAYMENT', 'PAID')`),
    check('orders_currency_iqd', sql`${t.currency} = 'IQD'`),
    check('orders_amount_positive', sql`${t.amountIqd} > 0`),
    check('orders_paid_consistent', sql`(${t.status} <> 'PAID') or (${t.paidAt} is not null and ${t.invoiceNumber} is not null)`),
  ],
);

export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    fromStatus: orderStatus('from_status'),
    toStatus: orderStatus('to_status').notNull(),
    actorType: historyActor('actor_type').notNull(),
    actorAdminId: uuid('actor_admin_id').references(() => adminUsers.id, { onDelete: 'restrict' }),
    reason: text('reason'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('order_status_history_order_idx').on(t.orderId, t.at)],
);

/**
 * Files made for a customer (design-kit PNG/PDF downloads; later the printable
 * card and keepsake PDF). Generated on first download and kept, so a repeat
 * download is instant; `source_hash` covers everything that shapes the file,
 * so an admin edit or a different option makes a new one.
 */
export const generatedDocuments = pgTable(
  'generated_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invitationId: uuid('invitation_id')
      .notNull()
      .references(() => invitations.id, { onDelete: 'restrict' }),
    themeVersionId: uuid('theme_version_id')
      .notNull()
      .references(() => themeVersions.id, { onDelete: 'restrict' }),
    /** e.g. `kit:sticker-round:pdf`. */
    variant: text('variant').notNull(),
    sourceHash: text('source_hash').notNull(),
    storageKey: text('storage_key').notNull().unique(),
    contentType: text('content_type').notNull(),
    bytes: integer('bytes').notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('generated_documents_source_uq').on(t.invitationId, t.sourceHash)],
);

/** Gap-free yearly invoice sequence; incremented in the same transaction that marks an order PAID. */
export const invoiceCounters = pgTable('invoice_counters', {
  year: integer('year').primaryKey(),
  last: integer('last').notNull().default(0),
});

/** Generic fixed-window rate limiting for public endpoints (checkout, guest responses…). */
export const rateLimitBuckets = pgTable(
  'rate_limit_buckets',
  {
    key: text('key').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    count: integer('count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

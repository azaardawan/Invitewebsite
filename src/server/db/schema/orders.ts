import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
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
import { assets, musicTracks, packages, sections, themeVersions, themes } from './catalog';

/**
 * Admin tweaks to the automatic printable card. `message`: undefined = the invitation's own message,
 * '' = no message, any other text replaces it on the card only. `showQr: false` hides the QR code.
 */
export type CardOptions = {
  message?: string;
  extraLine?: string;
  showQr?: boolean;
  /** The customer's text for the back of the card: a big title and a smaller message. */
  backTitle?: string;
  backMessage?: string;
};

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
    /** Admin tweaks to the automatic printable card (see CardOptions). */
    cardOptions: jsonb('card_options').$type<CardOptions>().notNull().default({}),
    /** Customer's choice: guest messages shown under the live invitation for everyone with the link (default: keepsake only). */
    publicGuestbook: boolean('public_guestbook').notNull().default(false),
    /** Customer's choice: how many guests are coming / not coming shown on the live invitation (default: only the customer sees it). */
    publicAttendance: boolean('public_attendance').notNull().default(false),
    /** The customer's drawn signature (packages with `signature`); null = none or not included. */
    signatureAssetId: uuid('signature_asset_id').references(() => assets.id, { onDelete: 'set null' }),
    /** A second signature, when the customer chose two (e.g. both of the couple). */
    signature2AssetId: uuid('signature2_asset_id').references(() => assets.id, { onDelete: 'set null' }),
    /** The colour set the customer picked (packages with `color_choice`), copied so later edits never change it. */
    colors: jsonb('colors').$type<Record<string, string>>(),
    /** Edits the customer made themselves after publishing (packages with `self_edit`). */
    selfEdits: integer('self_edits').notNull().default(0),
    /** Storage key of a card PDF the team designed and uploaded; replaces the automatic card while set. */
    cardCustomKey: text('card_custom_key'),
    /** Optimistic locking for concurrent admin edits. */
    version: integer('version').notNull().default(1),
    ...timestamps,
  },
  (t) => [
    index('invitations_status_expires_idx').on(t.status, t.expiresAt),
    check('invitations_published_consistent', sql`(${t.publishedAt} is null) = (${t.expiresAt} is null)`),
  ],
);

export const couponKind = pgEnum('coupon_kind', ['PERCENT', 'AMOUNT']);
export const couponStatus = pgEnum('coupon_status', ['ACTIVE', 'ARCHIVED']);

/** Discount codes created by the owner (e.g. 50% off, 10,000 IQD off, 100% off for the owner's own invitations). */
export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** What the customer types; stored upper-case, letters/digits/dashes. */
    code: text('code').notNull().unique(),
    kind: couponKind('kind').notNull(),
    /** PERCENT: 1–100. AMOUNT: whole dinars off. */
    value: integer('value').notNull(),
    /** Total orders that may use it (null = unlimited); counted when an order is placed. */
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    status: couponStatus('status').notNull().default('ACTIVE'),
    /** Private note for the team (who it is for). */
    note: text('note'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'restrict' }),
    ...timestamps,
  },
  (t) => [
    check('coupons_value_range', sql`${t.value} > 0 and (${t.kind} <> 'PERCENT' or ${t.value} <= 100)`),
    check('coupons_uses', sql`${t.usedCount} >= 0 and (${t.maxUses} is null or ${t.maxUses} > 0)`),
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
    /** Coupon used at checkout (null = none) and what it took off the package price. amountIqd is after it. */
    couponId: uuid('coupon_id').references(() => coupons.id, { onDelete: 'restrict' }),
    discountIqd: bigint('discount_iqd', { mode: 'number' }).notNull().default(0),
    currency: text('currency').notNull().default('IQD'),
    /** Immutable record of what was bought, at what price. Receipts are rendered from this, never from current prices. */
    snapshot: jsonb('snapshot').notNull(),
    /** Terms/refund policy versions accepted, when, from where. */
    legalAcceptance: jsonb('legal_acceptance').notNull(),
    receiptTokenHash: text('receipt_token_hash').notNull().unique(),
    /** Hash of the customer's 10-digit invitation number (see accessCodeFor); null only before backfill. */
    accessCodeHash: text('access_code_hash').unique(),
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
    // Zero only for a 100% coupon (paid immediately, nothing to collect).
    check('orders_amount_positive', sql`${t.amountIqd} >= 0 and ${t.discountIqd} >= 0`),
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

import { sql } from 'drizzle-orm';
import { bigint, bigserial, boolean, check, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { orders } from './orders';

export const paymentStatus = pgEnum('payment_status', ['CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED']);

/** One row per WAYL payment link (an order can need several attempts if a link expires). */
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    provider: text('provider').notNull().default('WAYL'),
    /** Attempt number for this order (1, 2, …). */
    attempt: integer('attempt').notNull(),
    /** Our `referenceId` at WAYL: `<order number>-<attempt>`. */
    providerReference: text('provider_reference').notNull().unique(),
    /** WAYL's own link id. */
    providerLinkId: text('provider_link_id'),
    /** `live` or `test` (WAYL test mode). */
    providerEnv: text('provider_env').notNull(),
    checkoutUrl: text('checkout_url'),
    amountIqd: bigint('amount_iqd', { mode: 'number' }).notNull(),
    status: paymentStatus('status').notNull().default('CREATED'),
    /** Last status string WAYL reported (Created, Pending, Processing, Complete, …). */
    providerStatus: text('provider_status'),
    linkExpiresAt: timestamp('link_expires_at', { withTimezone: true }).notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
    /** Why a verification was rejected (amount/currency mismatch), for the owner to investigate. */
    problem: text('problem'),
    rawCreateResponse: jsonb('raw_create_response'),
    rawVerifyResponse: jsonb('raw_verify_response'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('payments_order_attempt_uq').on(t.orderId, t.attempt),
    index('payments_status_idx').on(t.status, t.createdAt),
    check('payments_amount_positive', sql`${t.amountIqd} > 0`),
  ],
);

/**
 * Every webhook delivery, stored before processing. Deliveries are only a
 * signal: the payment state is always re-read from WAYL before acting.
 */
export const paymentWebhookEvents = pgTable(
  'payment_webhook_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    provider: text('provider').notNull().default('WAYL'),
    /** Hash of the raw body: a redelivered identical payload is recorded once. */
    dedupeKey: text('dedupe_key').notNull().unique(),
    providerReference: text('provider_reference'),
    signatureValid: boolean('signature_valid').notNull(),
    payload: jsonb('payload'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    outcome: text('outcome'),
  },
  (t) => [index('payment_webhook_events_ref_idx').on(t.providerReference)],
);

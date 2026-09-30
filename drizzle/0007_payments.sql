CREATE TYPE "public"."payment_status" AS ENUM('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "payment_webhook_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'WAYL' NOT NULL,
	"dedupe_key" text NOT NULL,
	"provider_reference" text,
	"signature_valid" boolean NOT NULL,
	"payload" jsonb,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"outcome" text,
	CONSTRAINT "payment_webhook_events_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'WAYL' NOT NULL,
	"attempt" integer NOT NULL,
	"provider_reference" text NOT NULL,
	"provider_link_id" text,
	"provider_env" text NOT NULL,
	"checkout_url" text,
	"amount_iqd" bigint NOT NULL,
	"status" "payment_status" DEFAULT 'CREATED' NOT NULL,
	"provider_status" text,
	"link_expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"problem" text,
	"raw_create_response" jsonb,
	"raw_verify_response" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_provider_reference_unique" UNIQUE("provider_reference"),
	CONSTRAINT "payments_amount_positive" CHECK ("payments"."amount_iqd" > 0)
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_webhook_events_ref_idx" ON "payment_webhook_events" USING btree ("provider_reference");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_order_attempt_uq" ON "payments" USING btree ("order_id","attempt");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status","created_at");
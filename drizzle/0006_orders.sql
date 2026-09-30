CREATE TYPE "public"."history_actor" AS ENUM('CUSTOMER', 'SYSTEM', 'WEBHOOK', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."invitation_locale" AS ENUM('ar', 'en', 'ckb', 'bdn');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('DRAFT', 'AWAITING_PAYMENT', 'PAID', 'PUBLISHED', 'UNPUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'AWAITING_PAYMENT', 'PAID', 'CANCELLED', 'PAYMENT_EXPIRED', 'REFUNDED');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone_e164" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"slug" text DEFAULT '' NOT NULL,
	"theme_id" uuid NOT NULL,
	"theme_version_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"section_id" uuid,
	"locale" "invitation_locale" NOT NULL,
	"field_values" jsonb NOT NULL,
	"field_keys" text[] NOT NULL,
	"feature_keys" text[] NOT NULL,
	"music_track_id" uuid,
	"status" "invitation_status" DEFAULT 'DRAFT' NOT NULL,
	"preview_token_hash" text,
	"preview_expires_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "invitations_preview_token_hash_unique" UNIQUE("preview_token_hash"),
	CONSTRAINT "invitations_published_consistent" CHECK (("invitations"."published_at" is null) = ("invitations"."expires_at" is null))
);
--> statement-breakpoint
CREATE TABLE "invoice_counters" (
	"year" integer PRIMARY KEY NOT NULL,
	"last" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"actor_type" "history_actor" NOT NULL,
	"actor_admin_id" uuid,
	"reason" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"invoice_number" text,
	"customer_id" uuid NOT NULL,
	"invitation_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"amount_iqd" bigint NOT NULL,
	"currency" text DEFAULT 'IQD' NOT NULL,
	"snapshot" jsonb NOT NULL,
	"legal_acceptance" jsonb NOT NULL,
	"receipt_token_hash" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "orders_receipt_token_hash_unique" UNIQUE("receipt_token_hash"),
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "orders_currency_iqd" CHECK ("orders"."currency" = 'IQD'),
	CONSTRAINT "orders_amount_positive" CHECK ("orders"."amount_iqd" > 0),
	CONSTRAINT "orders_paid_consistent" CHECK (("orders"."status" <> 'PAID') or ("orders"."paid_at" is not null and "orders"."invoice_number" is not null))
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limit_buckets_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_theme_version_id_theme_versions_id_fk" FOREIGN KEY ("theme_version_id") REFERENCES "public"."theme_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_music_track_id_music_tracks_id_fk" FOREIGN KEY ("music_track_id") REFERENCES "public"."music_tracks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_actor_admin_id_admin_users_id_fk" FOREIGN KEY ("actor_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone_e164");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitations_status_expires_idx" ON "invitations" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "order_status_history_order_idx" ON "order_status_history" USING btree ("order_id","at");--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "orders_invitation_idx" ON "orders" USING btree ("invitation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_one_active_per_invitation" ON "orders" USING btree ("invitation_id") WHERE "orders"."status" in ('PENDING', 'AWAITING_PAYMENT', 'PAID');
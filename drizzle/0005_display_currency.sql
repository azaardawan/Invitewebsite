CREATE TABLE "website_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "website_settings_singleton" CHECK ("website_settings"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "packages" DROP CONSTRAINT "packages_price_usd_range";--> statement-breakpoint
ALTER TABLE "website_settings" ADD CONSTRAINT "website_settings_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" DROP COLUMN "price_usd_cents";
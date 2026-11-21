ALTER TYPE "public"."asset_kind" ADD VALUE 'MODEL';--> statement-breakpoint
CREATE TABLE "tours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"model_asset_id" uuid,
	"logo_asset_id" uuid,
	"links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"live" boolean DEFAULT false NOT NULL,
	"ends_at" timestamp with time zone,
	"visits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tours_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tours_slug_format" CHECK ("tours"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_model_asset_id_assets_id_fk" FOREIGN KEY ("model_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_logo_asset_id_assets_id_fk" FOREIGN KEY ("logo_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
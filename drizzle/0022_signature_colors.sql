CREATE TABLE "theme_palettes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" uuid NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"colors" jsonb NOT NULL,
	"status" "package_status" DEFAULT 'ACTIVE' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "signature_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "colors" jsonb;--> statement-breakpoint
ALTER TABLE "theme_palettes" ADD CONSTRAINT "theme_palettes_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "theme_palettes_theme_idx" ON "theme_palettes" USING btree ("theme_id","status","sort_order");--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_signature_asset_id_assets_id_fk" FOREIGN KEY ("signature_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
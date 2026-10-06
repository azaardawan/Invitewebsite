ALTER TABLE "themes" ADD COLUMN "border_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "border_style" jsonb;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_border_asset_id_assets_id_fk" FOREIGN KEY ("border_asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;
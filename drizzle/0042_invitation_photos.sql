CREATE TABLE "invitation_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"asset_id" uuid NOT NULL,
	"display_asset_id" uuid NOT NULL,
	"focus" jsonb DEFAULT '{"x":50,"y":50,"zoom":1}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitation_photos" ADD CONSTRAINT "invitation_photos_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_photos" ADD CONSTRAINT "invitation_photos_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_photos" ADD CONSTRAINT "invitation_photos_display_asset_id_assets_id_fk" FOREIGN KEY ("display_asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_photos_position_idx" ON "invitation_photos" USING btree ("invitation_id","position");--> statement-breakpoint
CREATE INDEX "invitation_photos_asset_idx" ON "invitation_photos" USING btree ("asset_id");
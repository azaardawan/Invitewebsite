ALTER TYPE "public"."asset_kind" ADD VALUE 'VIDEO';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'POSTER_LANDSCAPE_JPG';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'POSTER_LANDSCAPE_PREVIEW';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'POSTER_PORTRAIT_JPG';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'POSTER_PORTRAIT_PREVIEW';--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "photo_limit" integer;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "photo_limit" integer;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "video_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "video_poster_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "invitation_photos" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "invitation_photos" ADD COLUMN "caption" text;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_video_asset_id_assets_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_video_poster_asset_id_assets_id_fk" FOREIGN KEY ("video_poster_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_photo_limit_range" CHECK ("packages"."photo_limit" is null or ("packages"."photo_limit" >= 1 and "packages"."photo_limit" <= 50));
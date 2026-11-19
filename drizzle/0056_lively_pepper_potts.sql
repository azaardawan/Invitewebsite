CREATE TABLE "invitation_videos" (
	"invitation_id" uuid NOT NULL,
	"place" integer NOT NULL,
	"video_asset_id" uuid NOT NULL,
	"poster_asset_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_videos_invitation_id_place_pk" PRIMARY KEY("invitation_id","place"),
	CONSTRAINT "invitation_videos_place_range" CHECK ("invitation_videos"."place" >= 1 and "invitation_videos"."place" <= 2)
);
--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "video_limit" integer;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "palette_ids" uuid[];--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "video_limit" integer;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "palette_ids" uuid[];--> statement-breakpoint
ALTER TABLE "invitation_videos" ADD CONSTRAINT "invitation_videos_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_videos" ADD CONSTRAINT "invitation_videos_video_asset_id_assets_id_fk" FOREIGN KEY ("video_asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_videos" ADD CONSTRAINT "invitation_videos_poster_asset_id_assets_id_fk" FOREIGN KEY ("poster_asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_video_limit_range" CHECK ("packages"."video_limit" is null or ("packages"."video_limit" >= 1 and "packages"."video_limit" <= 3));
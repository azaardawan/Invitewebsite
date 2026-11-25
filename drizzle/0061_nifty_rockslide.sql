ALTER TABLE "invitations" ADD COLUMN "film_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "film_for" text;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "film_job_id" text;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "film_job_for" text;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "film_tries" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_film_asset_id_assets_id_fk" FOREIGN KEY ("film_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
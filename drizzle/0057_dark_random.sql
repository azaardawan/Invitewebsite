CREATE TABLE "guest_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"device_hash" text NOT NULL,
	"guest_name" text NOT NULL,
	"storage_key" text NOT NULL,
	"thumb_key" text,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "guest_photos_cap" integer;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "guest_photos_per_guest" integer;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "guest_photos_token" text;--> statement-breakpoint
ALTER TABLE "guest_photos" ADD CONSTRAINT "guest_photos_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "guest_photos_same_idx" ON "guest_photos" USING btree ("invitation_id","sha256");--> statement-breakpoint
CREATE INDEX "guest_photos_device_idx" ON "guest_photos" USING btree ("invitation_id","device_hash");--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_guest_photos_token_unique" UNIQUE("guest_photos_token");
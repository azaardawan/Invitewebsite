ALTER TABLE "invitations" ADD COLUMN "bottle_size" text DEFAULT '500' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "birth_date_style" text DEFAULT 'long' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "birth_date_digits" text DEFAULT 'arab' NOT NULL;
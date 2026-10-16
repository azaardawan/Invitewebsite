ALTER TABLE "packages" ADD COLUMN "lifetime" text DEFAULT '30' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "lifetime" text DEFAULT '30' NOT NULL;
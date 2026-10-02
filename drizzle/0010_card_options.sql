ALTER TABLE "invitations" ADD COLUMN "card_options" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "card_custom_key" text;
ALTER TABLE "invitations" ADD COLUMN "signature_board" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "board_arrangement" jsonb;--> statement-breakpoint
ALTER TABLE "guest_responses" ADD COLUMN "signature" jsonb;
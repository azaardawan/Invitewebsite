CREATE TYPE "public"."guest_attendance" AS ENUM('ATTENDING', 'NOT_ATTENDING');--> statement-breakpoint
CREATE TYPE "public"."guest_message_status" AS ENUM('VISIBLE', 'HIDDEN');--> statement-breakpoint
CREATE TABLE "guest_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"guest_name" text NOT NULL,
	"attendance" "guest_attendance" NOT NULL,
	"message" text,
	"message_status" "guest_message_status" DEFAULT 'VISIBLE' NOT NULL,
	"ip_hash" text,
	"client_token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_responses_name_length" CHECK (char_length("guest_responses"."guest_name") between 1 and 80),
	CONSTRAINT "guest_responses_message_length" CHECK ("guest_responses"."message" is null or char_length("guest_responses"."message") between 1 and 500)
);
--> statement-breakpoint
ALTER TABLE "guest_responses" ADD CONSTRAINT "guest_responses_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "guest_responses_invitation_client_idx" ON "guest_responses" USING btree ("invitation_id","client_token_hash");--> statement-breakpoint
CREATE INDEX "guest_responses_invitation_created_idx" ON "guest_responses" USING btree ("invitation_id","created_at");
ALTER TYPE "public"."experience_type" ADD VALUE 'DESIGN_KIT';--> statement-breakpoint
CREATE TABLE "generated_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"theme_version_id" uuid NOT NULL,
	"variant" text NOT NULL,
	"source_hash" text NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"bytes" integer NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "generated_documents_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_theme_version_id_theme_versions_id_fk" FOREIGN KEY ("theme_version_id") REFERENCES "public"."theme_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "generated_documents_source_uq" ON "generated_documents" USING btree ("invitation_id","source_hash");
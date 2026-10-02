CREATE TYPE "public"."legal_policy_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."legal_policy_type" AS ENUM('TERMS', 'PRIVACY', 'REFUND');--> statement-breakpoint
CREATE TABLE "legal_policy_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "legal_policy_type" NOT NULL,
	"version" integer NOT NULL,
	"status" "legal_policy_status" DEFAULT 'DRAFT' NOT NULL,
	"content" jsonb NOT NULL,
	"created_by" uuid,
	"published_by" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "legal_policy_versions" ADD CONSTRAINT "legal_policy_versions_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_policy_versions" ADD CONSTRAINT "legal_policy_versions_published_by_admin_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "legal_policy_versions_type_version_idx" ON "legal_policy_versions" USING btree ("type","version");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_policy_versions_one_draft_idx" ON "legal_policy_versions" USING btree ("type") WHERE "legal_policy_versions"."status" = 'DRAFT';--> statement-breakpoint
CREATE INDEX "legal_policy_versions_published_idx" ON "legal_policy_versions" USING btree ("type","published_at");
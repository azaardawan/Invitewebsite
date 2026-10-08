CREATE TABLE "subsections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"description_i18n" jsonb,
	"status" "section_status" DEFAULT 'ACTIVE' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subsections_section_key" UNIQUE("section_id","key"),
	CONSTRAINT "subsections_key_format" CHECK ("subsections"."key" ~ '^[a-z][a-z0-9-]{1,39}$')
);
--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "subsection_id" uuid;--> statement-breakpoint
ALTER TABLE "subsections" ADD CONSTRAINT "subsections_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subsections_order_idx" ON "subsections" USING btree ("section_id","status","sort_order");--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_subsection_id_subsections_id_fk" FOREIGN KEY ("subsection_id") REFERENCES "public"."subsections"("id") ON DELETE set null ON UPDATE no action;
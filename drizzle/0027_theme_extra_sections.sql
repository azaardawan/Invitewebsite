CREATE TABLE "theme_extra_sections" (
	"theme_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	CONSTRAINT "theme_extra_sections_theme_id_section_id_pk" PRIMARY KEY("theme_id","section_id")
);
--> statement-breakpoint
ALTER TABLE "theme_extra_sections" ADD CONSTRAINT "theme_extra_sections_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_extra_sections" ADD CONSTRAINT "theme_extra_sections_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "theme_extra_sections_section_idx" ON "theme_extra_sections" USING btree ("section_id");
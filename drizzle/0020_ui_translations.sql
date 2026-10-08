CREATE TABLE "ui_translations" (
	"key" text NOT NULL,
	"locale" "invitation_locale" NOT NULL,
	"value" text NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ui_translations_key_locale_pk" PRIMARY KEY("key","locale")
);
--> statement-breakpoint
ALTER TABLE "ui_translations" ADD CONSTRAINT "ui_translations_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;
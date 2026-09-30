CREATE TYPE "public"."asset_kind" AS ENUM('IMAGE', 'AUDIO');--> statement-breakpoint
CREATE TYPE "public"."experience_type" AS ENUM('INVITATION');--> statement-breakpoint
CREATE TYPE "public"."music_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."package_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."section_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."theme_status" AS ENUM('DEVELOPMENT', 'READY_FOR_REVIEW', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "asset_kind" NOT NULL,
	"storage_key" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"duration_seconds" integer,
	"sha256" text NOT NULL,
	"original_filename" text,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "field_definitions" (
	"key" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"label_i18n" jsonb NOT NULL,
	"max_length" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"asset_id" uuid NOT NULL,
	"status" "music_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_features" (
	"package_id" uuid NOT NULL,
	"feature_key" text NOT NULL,
	CONSTRAINT "package_features_package_id_feature_key_pk" PRIMARY KEY("package_id","feature_key")
);
--> statement-breakpoint
CREATE TABLE "package_fields" (
	"package_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	CONSTRAINT "package_fields_package_id_field_key_pk" PRIMARY KEY("package_id","field_key")
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" uuid NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"description_i18n" jsonb,
	"price_iqd" bigint NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "package_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "packages_price_range" CHECK ("packages"."price_iqd" > 0 and "packages"."price_iqd" <= 100000000)
);
--> statement-breakpoint
CREATE TABLE "section_default_fields" (
	"section_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"label_i18n" jsonb,
	CONSTRAINT "section_default_fields_section_id_field_key_pk" PRIMARY KEY("section_id","field_key")
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"description_i18n" jsonb,
	"image_asset_id" uuid,
	"status" "section_status" DEFAULT 'ACTIVE' NOT NULL,
	"experience_type" "experience_type" DEFAULT 'INVITATION' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"required_features" text[] DEFAULT '{}'::text[] NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sections_key_unique" UNIQUE("key"),
	CONSTRAINT "sections_key_format" CHECK ("sections"."key" ~ '^[a-z][a-z0-9-]{1,39}$')
);
--> statement-breakpoint
CREATE TABLE "theme_fields" (
	"theme_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"label_i18n" jsonb,
	CONSTRAINT "theme_fields_theme_id_field_key_pk" PRIMARY KEY("theme_id","field_key")
);
--> statement-breakpoint
CREATE TABLE "theme_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"code_ref" text NOT NULL,
	"manifest" jsonb NOT NULL,
	"manifest_hash" text NOT NULL,
	"frozen_at" timestamp with time zone,
	"in_build" boolean DEFAULT true NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "theme_versions_code_ref_unique" UNIQUE("code_ref"),
	CONSTRAINT "theme_versions_theme_version_uq" UNIQUE("theme_id","version")
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"section_id" uuid,
	"name_i18n" jsonb NOT NULL,
	"description_i18n" jsonb,
	"status" "theme_status" DEFAULT 'DEVELOPMENT' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"cover_asset_id" uuid,
	"music_track_id" uuid,
	"current_version_id" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "themes_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_uploaded_by_admin_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD CONSTRAINT "music_tracks_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_features" ADD CONSTRAINT "package_features_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_fields" ADD CONSTRAINT "package_fields_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_fields" ADD CONSTRAINT "package_fields_field_key_field_definitions_key_fk" FOREIGN KEY ("field_key") REFERENCES "public"."field_definitions"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_default_fields" ADD CONSTRAINT "section_default_fields_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_default_fields" ADD CONSTRAINT "section_default_fields_field_key_field_definitions_key_fk" FOREIGN KEY ("field_key") REFERENCES "public"."field_definitions"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_image_asset_id_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_fields" ADD CONSTRAINT "theme_fields_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_fields" ADD CONSTRAINT "theme_fields_field_key_field_definitions_key_fk" FOREIGN KEY ("field_key") REFERENCES "public"."field_definitions"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_versions" ADD CONSTRAINT "theme_versions_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_cover_asset_id_assets_id_fk" FOREIGN KEY ("cover_asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_music_track_id_music_tracks_id_fk" FOREIGN KEY ("music_track_id") REFERENCES "public"."music_tracks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_current_version_id_theme_versions_id_fk" FOREIGN KEY ("current_version_id") REFERENCES "public"."theme_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "packages_theme_idx" ON "packages" USING btree ("theme_id","status","sort_order");--> statement-breakpoint
CREATE INDEX "sections_order_idx" ON "sections" USING btree ("status","sort_order");--> statement-breakpoint
CREATE INDEX "themes_section_order_idx" ON "themes" USING btree ("section_id","status","sort_order");
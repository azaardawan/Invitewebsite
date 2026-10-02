CREATE TABLE "analytics_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" text,
	"locale" text,
	"device_class" text,
	"referrer_host" text,
	"theme_id" uuid,
	"package_id" uuid,
	"invitation_id" uuid,
	"order_id" uuid
);
--> statement-breakpoint
CREATE INDEX "analytics_events_name_time_idx" ON "analytics_events" USING btree ("name","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_theme_idx" ON "analytics_events" USING btree ("theme_id","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_invitation_idx" ON "analytics_events" USING btree ("invitation_id");
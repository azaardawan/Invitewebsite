ALTER TYPE "public"."document_kind" ADD VALUE 'STORY_PNG';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'STICKER_PDF';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'STICKER_PNG';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'BOTTLE_PDF';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'BOTTLE_PNG';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'STORY_PREVIEW';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'STICKER_PREVIEW';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'BOTTLE_PREVIEW';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'CARD_DRAFT_PREVIEW';--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "sticker_shape" text DEFAULT 'round' NOT NULL;
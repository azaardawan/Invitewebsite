DROP INDEX "generated_documents_invitation_kind_idx";--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "card_choices" text[] DEFAULT '{a5}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD COLUMN "variant" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "generated_documents_invitation_kind_variant_idx" ON "generated_documents" USING btree ("invitation_id","kind","variant");--> statement-breakpoint
-- The one shape a customer chose before becomes their list of cards; files already made for it are filed under that shape.
UPDATE "invitations" SET "card_choices" = ARRAY["card_shape"] WHERE "card_shape" IS NOT NULL;--> statement-breakpoint
UPDATE "generated_documents" d SET "variant" = i."card_shape"
FROM "invitations" i
WHERE d."invitation_id" = i."id" AND i."card_shape" IS NOT NULL
  AND d."kind"::text IN ('PRINT_CARD', 'PRINT_CARD_PREVIEW', 'PRINT_CARD_BACK_PREVIEW', 'CARD_DRAFT_PREVIEW', 'CARD_BACK_DRAFT_PREVIEW');

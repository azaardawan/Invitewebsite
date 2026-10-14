DROP INDEX "generated_documents_invitation_kind_idx";--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "card_shapes" text[];--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "card_shapes" text[];--> statement-breakpoint
ALTER TABLE "generated_documents" ADD COLUMN "variant" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "generated_documents_invitation_kind_variant_idx" ON "generated_documents" USING btree ("invitation_id","kind","variant");
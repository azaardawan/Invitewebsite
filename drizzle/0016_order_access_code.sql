ALTER TABLE "orders" ADD COLUMN "access_code_hash" text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_access_code_hash_unique" UNIQUE("access_code_hash");
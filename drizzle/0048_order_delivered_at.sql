ALTER TABLE "orders" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
-- Orders paid before this change count as delivered: no surprise messages for old orders.
UPDATE "orders" SET "delivered_at" = "paid_at" WHERE "status" = 'PAID';

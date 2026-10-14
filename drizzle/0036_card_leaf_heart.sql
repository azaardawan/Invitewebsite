-- Shaped printed cards are now sold one shape at a time: `card_shapes` becomes `card_leaf` and `card_heart`.
-- A package (or an invitation's feature snapshot) that had `card_shapes` keeps both shapes.
INSERT INTO "package_features" ("package_id", "feature_key")
SELECT "package_id", k FROM "package_features", unnest(ARRAY['card_leaf', 'card_heart']) AS k
WHERE "feature_key" = 'card_shapes'
ON CONFLICT DO NOTHING;--> statement-breakpoint
DELETE FROM "package_features" WHERE "feature_key" = 'card_shapes';--> statement-breakpoint
UPDATE "invitations"
SET "feature_keys" = array_remove("feature_keys", 'card_shapes') || ARRAY['card_leaf', 'card_heart']
WHERE 'card_shapes' = ANY("feature_keys");

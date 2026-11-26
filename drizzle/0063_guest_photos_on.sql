-- Guest photo sharing on the order form after choosing a package (owner, 2026-11-26): switched on once; the owner can
-- still turn it off in Admin → Settings.
UPDATE "website_settings" SET "data" = jsonb_set("data", '{guestPhotos,enabled}', 'true'::jsonb) WHERE "data" ? 'guestPhotos';

-- The two families on their own (person_1_family, person_2_family): added to the field library (the seed keeps it in
-- sync afterwards) and to the wedding and engagement sections the owner already has, with each occasion's wording.
-- Runs once, so a section the owner later edits keeps the owner's choice.
INSERT INTO "field_definitions" ("key", "type", "label_i18n", "max_length") VALUES
  ('person_1_family', 'text', '{"ar":"عائلة العريس","en":"Groom''s family"}', 60),
  ('person_2_family', 'text', '{"ar":"عائلة العروس","en":"Bride''s family"}', 60)
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "section_default_fields" ("section_id", "field_key", "sort_order", "label_i18n")
SELECT s."id", f.key, coalesce((SELECT max(d."sort_order") FROM "section_default_fields" d WHERE d."section_id" = s."id"), -1) + f.n, NULL
FROM "sections" s, (VALUES ('person_1_family', 1), ('person_2_family', 2)) AS f(key, n)
WHERE s."key" = 'wedding'
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "section_default_fields" ("section_id", "field_key", "sort_order", "label_i18n")
SELECT s."id", f.key, coalesce((SELECT max(d."sort_order") FROM "section_default_fields" d WHERE d."section_id" = s."id"), -1) + f.n, f.label::jsonb
FROM "sections" s, (VALUES
  ('person_1_family', 1, '{"ar":"عائلة الخطيب","en":"Fiancé''s family"}'),
  ('person_2_family', 2, '{"ar":"عائلة الخطيبة","en":"Fiancée''s family"}')) AS f(key, n, label)
WHERE s."key" = 'engagement'
ON CONFLICT DO NOTHING;

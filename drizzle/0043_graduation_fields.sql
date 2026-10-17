-- Graduation: the degree or achievement, and the class year (optional; the design writes the event's year when it is
-- empty). Added to the field library (the seed keeps it in sync afterwards) and, right after the graduate's name, to the
-- graduation section the owner already has. Runs once, so a section the owner later edits keeps the owner's choice.
INSERT INTO "field_definitions" ("key", "type", "label_i18n", "max_length") VALUES
  ('achievement', 'text', '{"ar":"الشهادة أو التخصص","en":"Degree or achievement"}', 80),
  ('class_year', 'text', '{"ar":"سنة الدفعة","en":"Class year"}', 12)
ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "section_default_fields" d SET "sort_order" = d."sort_order" + 2
FROM "sections" s
WHERE d."section_id" = s."id" AND s."key" = 'graduation' AND d."field_key" <> 'person_1_name'
  AND NOT EXISTS (SELECT 1 FROM "section_default_fields" x WHERE x."section_id" = s."id" AND x."field_key" = 'achievement');--> statement-breakpoint
INSERT INTO "section_default_fields" ("section_id", "field_key", "sort_order", "label_i18n")
SELECT s."id", f.key, coalesce((SELECT d."sort_order" FROM "section_default_fields" d WHERE d."section_id" = s."id" AND d."field_key" = 'person_1_name'), -1) + f.n, NULL
FROM "sections" s, (VALUES ('achievement', 1), ('class_year', 2)) AS f(key, n)
WHERE s."key" = 'graduation'
ON CONFLICT DO NOTHING;

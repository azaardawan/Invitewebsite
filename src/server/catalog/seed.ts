import 'server-only';
import { and, eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { fieldDefinitions, sectionDefaultFields, sections, subsections, type I18nContent } from '@/server/db/schema';
import { FIELD_KEYS, STANDARD_FIELDS, type FieldKey } from '@/catalog/fields';
import { syncFieldLibrary } from './fields';

type StarterSection = {
  key: string;
  name: I18nContent;
  requiredFeatures: string[];
  fields: { key: FieldKey; label?: I18nContent }[];
  /** Starter groups inside the section, e.g. newborn Boy / Girl. */
  subsections?: { key: string; name: I18nContent }[];
};

/**
 * Starter sections, created only if their key doesn't exist yet. After that
 * they belong to the owner: names, order, fields and status are managed in
 * Admin, and seeding never overwrites them. The owner-approved Kurdish is only
 * added where a name or label still has the seeded Arabic and no Kurdish.
 */
const STARTER_SECTIONS: StarterSection[] = [
  {
    key: 'wedding',
    name: { ar: 'زفاف', en: 'Wedding', ckb: 'هاوسەرگیری', bdn: 'داوەت' },
    // Owner decision M: every wedding package includes the printable card.
    requiredFeatures: ['print_card'],
    fields: [
      { key: 'person_1_name', label: { ar: 'اسم العريس', en: "Groom's name", ckb: 'ناوی زاوا', bdn: 'ناڤێ زاڤای' } },
      { key: 'person_2_name', label: { ar: 'اسم العروس', en: "Bride's name", ckb: 'ناوی بووک', bdn: 'ناڤێ بویکێ' } },
      { key: 'family_names' },
      { key: 'event_date' },
      { key: 'event_time' },
      { key: 'venue_name', label: { ar: 'اسم القاعة', en: 'Hall name', ckb: 'ناوی هۆڵ', bdn: 'ناڤێ هۆلێ' } },
      { key: 'venue_map_url' },
      { key: 'invitation_message' },
    ],
  },
  {
    key: 'engagement',
    name: { ar: 'خطوبة', en: 'Engagement', ckb: 'دەستگیرانی', bdn: 'دەزگرانی' },
    requiredFeatures: [],
    fields: [
      { key: 'person_1_name', label: { ar: 'اسم الخطيب', en: "Fiancé's name", ckb: 'ناوی دەستگیرانی کوڕ', bdn: 'ناڤێ دەزگرانێ کوڕ' } },
      { key: 'person_2_name', label: { ar: 'اسم الخطيبة', en: "Fiancée's name", ckb: 'ناوی دەستگیرانی کچ', bdn: 'ناڤێ دەزگرانا کچ' } },
      { key: 'event_date' },
      { key: 'event_time' },
      { key: 'venue_name' },
      { key: 'venue_map_url' },
      { key: 'invitation_message' },
    ],
  },
  {
    key: 'graduation',
    name: { ar: 'تخرّج', en: 'Graduation', ckb: 'دەرچوون', bdn: 'دەرچوون' },
    requiredFeatures: [],
    fields: [
      { key: 'person_1_name', label: { ar: 'اسم الخرّيج', en: "Graduate's name", ckb: 'ناوی دەرچوو', bdn: 'ناڤێ دەرچووی' } },
      { key: 'event_date' },
      { key: 'event_time' },
      { key: 'venue_name' },
      { key: 'venue_map_url' },
      { key: 'invitation_message' },
    ],
  },
  {
    key: 'birthday',
    name: { ar: 'عيد ميلاد', en: 'Birthday', ckb: 'ڕۆژی لەدایکبوون', bdn: 'ڕۆژا ژدایکبوونێ' },
    requiredFeatures: [],
    fields: [
      { key: 'person_1_name', label: { ar: 'اسم صاحب المناسبة', en: 'Name of the birthday person', ckb: 'ناوی خاوەنی ڕۆژی لەدایکبوون', bdn: 'ناڤێ خودانێ ڕۆژا ژدایکبوونێ' } },
      { key: 'event_date' },
      { key: 'event_time' },
      { key: 'venue_name' },
      { key: 'venue_map_url' },
      { key: 'invitation_message' },
    ],
  },
  {
    key: 'newborn',
    // Kurdish awaits the owner's approval (docs/translations/KURDISH_REVIEW.md).
    name: { ar: 'مولود جديد', en: 'Newborn baby' },
    // Ticked by default on new packages (the owner chooses per package).
    requiredFeatures: ['story', 'print_card', 'sticker', 'bottle_label'],
    fields: [{ key: 'baby_name' }, { key: 'baby_gender' }, { key: 'mother_name' }, { key: 'father_name' }, { key: 'birth_date' }, { key: 'baby_quote' }],
    // Designs for a boy or a girl, so parents who know can go straight to them. A design in one of these
    // starts the order form with that gender chosen.
    subsections: [
      { key: 'boy', name: { ar: 'ولد', en: 'Boy' } },
      { key: 'girl', name: { ar: 'بنت', en: 'Girl' } },
    ],
  },
];

export async function seedCatalog(db: DbOrTx) {
  await syncFieldLibrary(db);
  for (const [i, s] of STARTER_SECTIONS.entries()) {
    const inserted = await db
      .insert(sections)
      .values({ key: s.key, name: s.name, requiredFeatures: s.requiredFeatures, sortOrder: i })
      .onConflictDoNothing({ target: sections.key })
      .returning({ id: sections.id });
    const id = inserted[0]?.id;
    if (id) {
      await db.insert(sectionDefaultFields).values(
        s.fields.map((f, order) => ({ sectionId: id, fieldKey: f.key, sortOrder: order, label: f.label ?? null })),
      );
    }
    await seedSubsections(db, s);
  }
  await addMissingKurdish(db);
}

/**
 * Adds a section's starter subsections that don't exist yet (also for a section seeded before they were
 * added). An existing one, archived or renamed by the owner, is left as it is; subsections are never deleted.
 */
async function seedSubsections(db: DbOrTx, s: StarterSection) {
  if (!s.subsections?.length) return;
  const sectionId = await sectionIdByKey(db, s.key);
  if (!sectionId) return;
  const existing = await db.select({ sortOrder: subsections.sortOrder }).from(subsections).where(eq(subsections.sectionId, sectionId));
  let next = existing.reduce((m, r) => Math.max(m, r.sortOrder + 1), 0);
  for (const sub of s.subsections) {
    const inserted = await db
      .insert(subsections)
      .values({ sectionId, key: sub.key, name: sub.name, sortOrder: next })
      .onConflictDoNothing({ target: [subsections.sectionId, subsections.key] })
      .returning({ id: subsections.id });
    if (inserted.length) next++;
  }
}

export async function sectionIdByKey(db: DbOrTx, key: string) {
  const [row] = await db.select({ id: sections.id }).from(sections).where(eq(sections.key, key));
  return row?.id;
}


/** Adds the approved Kurdish to starter names and labels the owner hasn't changed (Arabic as seeded, Kurdish empty). */
async function addMissingKurdish(db: DbOrTx) {
  const fill = (current: I18nContent | null, seeded: I18nContent | undefined) =>
    current && seeded && current.ar === seeded.ar && !(current.ckb && current.bdn)
      ? { ...current, ckb: current.ckb || seeded.ckb || null, bdn: current.bdn || seeded.bdn || null }
      : null;
  for (const s of STARTER_SECTIONS) {
    const [row] = await db.select().from(sections).where(eq(sections.key, s.key));
    if (!row) continue;
    const name = fill(row.name, s.name);
    if (name) await db.update(sections).set({ name }).where(eq(sections.id, row.id));
    const defaults = await db.select().from(sectionDefaultFields).where(eq(sectionDefaultFields.sectionId, row.id));
    for (const d of defaults) {
      const label = fill(d.label, s.fields.find((f) => f.key === d.fieldKey)?.label);
      if (label) {
        await db
          .update(sectionDefaultFields)
          .set({ label })
          .where(and(eq(sectionDefaultFields.sectionId, row.id), eq(sectionDefaultFields.fieldKey, d.fieldKey)));
      }
    }
  }
  for (const key of FIELD_KEYS) {
    const [row] = await db.select().from(fieldDefinitions).where(eq(fieldDefinitions.key, key));
    const label = row ? fill(row.label, STANDARD_FIELDS[key].label) : null;
    if (label) await db.update(fieldDefinitions).set({ label }).where(eq(fieldDefinitions.key, key));
  }
}

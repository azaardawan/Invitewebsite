import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { sectionDefaultFields, sections, type I18nContent } from '@/server/db/schema';
import type { FieldKey } from '@/catalog/fields';
import { syncFieldLibrary } from './fields';

type StarterSection = {
  key: string;
  name: I18nContent;
  requiredFeatures: string[];
  fields: { key: FieldKey; label?: I18nContent }[];
};

/**
 * Starter sections, created only if their key doesn't exist yet. After that
 * they belong to the owner: names, order, fields and status are managed in
 * Admin, and seeding never overwrites them. Kurdish names are left empty for
 * the owner to fill in.
 */
const STARTER_SECTIONS: StarterSection[] = [
  {
    key: 'wedding',
    name: { ar: 'زفاف', en: 'Wedding' },
    // Owner decision M: every wedding package includes the printable card.
    requiredFeatures: ['print_card'],
    fields: [
      { key: 'person_1_name', label: { ar: 'اسم العريس', en: "Groom's name" } },
      { key: 'person_2_name', label: { ar: 'اسم العروس', en: "Bride's name" } },
      { key: 'family_names' },
      { key: 'event_date' },
      { key: 'event_time' },
      { key: 'venue_name', label: { ar: 'اسم القاعة', en: 'Hall name' } },
      { key: 'venue_map_url' },
      { key: 'invitation_message' },
    ],
  },
  {
    key: 'engagement',
    name: { ar: 'خطوبة', en: 'Engagement' },
    requiredFeatures: [],
    fields: [
      { key: 'person_1_name', label: { ar: 'اسم الخطيب', en: "Fiancé's name" } },
      { key: 'person_2_name', label: { ar: 'اسم الخطيبة', en: "Fiancée's name" } },
      { key: 'event_date' },
      { key: 'event_time' },
      { key: 'venue_name' },
      { key: 'venue_map_url' },
      { key: 'invitation_message' },
    ],
  },
  {
    key: 'graduation',
    name: { ar: 'تخرّج', en: 'Graduation' },
    requiredFeatures: [],
    fields: [
      { key: 'person_1_name', label: { ar: 'اسم الخرّيج', en: "Graduate's name" } },
      { key: 'event_date' },
      { key: 'event_time' },
      { key: 'venue_name' },
      { key: 'venue_map_url' },
      { key: 'invitation_message' },
    ],
  },
  {
    key: 'birthday',
    name: { ar: 'عيد ميلاد', en: 'Birthday' },
    requiredFeatures: [],
    fields: [
      { key: 'person_1_name', label: { ar: 'اسم صاحب المناسبة', en: 'Name of the birthday person' } },
      { key: 'event_date' },
      { key: 'event_time' },
      { key: 'venue_name' },
      { key: 'venue_map_url' },
      { key: 'invitation_message' },
    ],
  },
];

export async function seedCatalog(db: DbOrTx) {
  await syncFieldLibrary(db);
  for (const [i, s] of STARTER_SECTIONS.entries()) {
    const inserted = await db
      .insert(sections)
      .values({ key: s.key, name: { ...s.name, ckb: null, bdn: null }, requiredFeatures: s.requiredFeatures, sortOrder: i })
      .onConflictDoNothing({ target: sections.key })
      .returning({ id: sections.id });
    const id = inserted[0]?.id;
    if (!id) continue;
    await db.insert(sectionDefaultFields).values(
      s.fields.map((f, order) => ({ sectionId: id, fieldKey: f.key, sortOrder: order, label: f.label ? { ...f.label, ckb: null, bdn: null } : null })),
    );
  }
}

export async function sectionIdByKey(db: DbOrTx, key: string) {
  const [row] = await db.select({ id: sections.id }).from(sections).where(eq(sections.key, key));
  return row?.id;
}


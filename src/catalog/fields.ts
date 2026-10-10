/**
 * The Field Library: standard invitation fields.
 *
 * Keys and types are defined in code because theme code renders them by key.
 * Labels and length limits are editable in Admin (stored in `field_definitions`);
 * the values here are the seeded defaults. Adding a field: add it here, then
 * `pnpm db:seed`. Every future theme can then use it.
 */
/** `date` is an upcoming event date; `past_date` is a date that already happened (e.g. a birth date). */
export const FIELD_TYPES = ['text', 'longtext', 'date', 'past_date', 'time', 'url', 'phone'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type I18nText = { ar: string; en: string; ckb?: string | null; bdn?: string | null };

export type FieldSpec = {
  type: FieldType;
  /** Default and upper bound for the admin-editable max length (text types). */
  maxLength?: number;
  label: I18nText;
};

export const STANDARD_FIELDS = {
  person_1_name: { type: 'text', maxLength: 40, label: { ar: 'الاسم الأول', en: 'First name' } },
  person_2_name: { type: 'text', maxLength: 40, label: { ar: 'الاسم الثاني', en: 'Second name' } },
  family_names: { type: 'longtext', maxLength: 150, label: { ar: 'أسماء العائلتين', en: 'Family names' } },
  event_date: { type: 'date', label: { ar: 'تاريخ المناسبة', en: 'Event date' } },
  event_time: { type: 'time', label: { ar: 'وقت المناسبة', en: 'Event time' } },
  venue_name: { type: 'text', maxLength: 80, label: { ar: 'اسم المكان', en: 'Venue name' } },
  venue_map_url: { type: 'url', label: { ar: 'رابط موقع المكان على الخريطة', en: 'Venue map link' } },
  invitation_message: { type: 'longtext', maxLength: 300, label: { ar: 'نص الدعوة', en: 'Invitation message' } },
  baby_name: { type: 'text', maxLength: 25, label: { ar: 'اسم المولود', en: "Baby's name" } },
  father_name: { type: 'text', maxLength: 30, label: { ar: 'اسم الأب', en: "Father's name" } },
  birth_date: { type: 'past_date', label: { ar: 'تاريخ الولادة', en: 'Date of birth' } },
} as const satisfies Record<string, FieldSpec>;

export type FieldKey = keyof typeof STANDARD_FIELDS;
export const FIELD_KEYS = Object.keys(STANDARD_FIELDS) as FieldKey[];

export function isFieldKey(value: string): value is FieldKey {
  return Object.hasOwn(STANDARD_FIELDS, value);
}

/** Absolute upper bound for any admin-configured text length. */
export const MAX_TEXT_LENGTH = 1000;

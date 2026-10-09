/**
 * The Field Library: standard invitation fields.
 *
 * Keys and types are defined in code because theme code renders them by key.
 * Labels and length limits are editable in Admin (stored in `field_definitions`);
 * the values here are the seeded defaults. Adding a field: add it here, then
 * `pnpm db:seed`. Every future theme can then use it.
 */
/**
 * `date`: an upcoming event (today up to two years ahead). `birthdate`: a date of birth (up to three years back,
 * or up to a year ahead for an expected birth). `choice`: one of the field's fixed `options`.
 */
export const FIELD_TYPES = ['text', 'longtext', 'date', 'birthdate', 'time', 'url', 'phone', 'choice'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type I18nText = { ar: string; en: string; ckb?: string | null; bdn?: string | null };

export type FieldSpec = {
  type: FieldType;
  /** Default and upper bound for the admin-editable max length (text types). */
  maxLength?: number;
  label: I18nText;
  /** `choice` fields: the stored values (labels live in the message files under `fieldOptions`). */
  options?: readonly string[];
};

export const STANDARD_FIELDS = {
  person_1_name: { type: 'text', maxLength: 40, label: { ar: 'الاسم الأول', en: 'First name', ckb: 'ناوی یەکەم', bdn: 'ناڤێ ئێکێ' } },
  person_2_name: { type: 'text', maxLength: 40, label: { ar: 'الاسم الثاني', en: 'Second name', ckb: 'ناوی دووەم', bdn: 'ناڤێ دووێ' } },
  family_names: { type: 'longtext', maxLength: 150, label: { ar: 'أسماء العائلتين', en: 'Family names', ckb: 'ناوی هەردوو بنەماڵە', bdn: 'ناڤێن هەردوو بنەمالان' } },
  event_date: { type: 'date', label: { ar: 'تاريخ المناسبة', en: 'Event date', ckb: 'بەرواری بۆنە', bdn: 'دیرۆکا ئاهەنگێ' } },
  event_time: { type: 'time', label: { ar: 'وقت المناسبة', en: 'Event time', ckb: 'کاتی بۆنە', bdn: 'دەمێ ئاهەنگێ' } },
  venue_name: { type: 'text', maxLength: 80, label: { ar: 'اسم المكان', en: 'Venue name', ckb: 'ناوی شوێن', bdn: 'ناڤێ جهی' } },
  venue_map_url: { type: 'url', label: { ar: 'رابط موقع المكان على الخريطة', en: 'Venue map link', ckb: 'بەستەری شوێن لەسەر نەخشە', bdn: 'لینکا جهی ل سەر نەخشەی' } },
  invitation_message: { type: 'longtext', maxLength: 300, label: { ar: 'نص الدعوة', en: 'Invitation message', ckb: 'دەقی بانگهێشتنامە', bdn: 'نڤیسینا داخوازنامێ' } },
  // Newborn baby (Kurdish labels await the owner's approval: docs/translations/KURDISH_REVIEW.md).
  baby_name: { type: 'text', maxLength: 40, label: { ar: 'اسم المولود', en: "Baby's name" } },
  baby_gender: { type: 'choice', options: ['boy', 'girl'], label: { ar: 'ولد أم بنت', en: 'Boy or girl' } },
  mother_name: { type: 'text', maxLength: 40, label: { ar: 'اسم الأم', en: "Mother's name" } },
  father_name: { type: 'text', maxLength: 40, label: { ar: 'اسم الأب', en: "Father's name" } },
  birth_date: { type: 'birthdate', label: { ar: 'تاريخ الولادة', en: 'Date of birth' } },
  baby_quote: { type: 'text', maxLength: 120, label: { ar: 'عبارة قصيرة', en: 'A short quote' } },
} as const satisfies Record<string, FieldSpec>;

export type FieldKey = keyof typeof STANDARD_FIELDS;
export const FIELD_KEYS = Object.keys(STANDARD_FIELDS) as FieldKey[];

export function isFieldKey(value: string): value is FieldKey {
  return Object.hasOwn(STANDARD_FIELDS, value);
}

/** Absolute upper bound for any admin-configured text length. */
export const MAX_TEXT_LENGTH = 1000;

/** The fixed options of a `choice` field (empty for other fields). */
export function fieldOptions(key: string): readonly string[] {
  return isFieldKey(key) ? ((STANDARD_FIELDS[key] as FieldSpec).options ?? []) : [];
}

/** The names an invitation is "for": the couple, or else the baby (for slugs, lists and titles). */
export function invitationNames(values: Readonly<Partial<Record<string, string | undefined>>>): string[] {
  const couple = [values.person_1_name, values.person_2_name].filter((n): n is string => Boolean(n));
  return couple.length ? couple : [values.baby_name].filter((n): n is string => Boolean(n));
}

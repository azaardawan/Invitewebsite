/**
 * The Field Library: standard invitation fields.
 *
 * Keys and types are defined in code because theme code renders them by key.
 * Labels and length limits are editable in Admin (stored in `field_definitions`);
 * the values here are the seeded defaults. Adding a field: add it here, then
 * `pnpm db:seed`. Every future theme can then use it.
 */
export const FIELD_TYPES = ['text', 'longtext', 'date', 'time', 'url', 'phone'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type I18nText = { ar: string; en: string; ckb?: string | null; bdn?: string | null };

export type FieldSpec = {
  type: FieldType;
  /** Default and upper bound for the admin-editable max length (text types). */
  maxLength?: number;
  label: I18nText;
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
} as const satisfies Record<string, FieldSpec>;

export type FieldKey = keyof typeof STANDARD_FIELDS;
export const FIELD_KEYS = Object.keys(STANDARD_FIELDS) as FieldKey[];

export function isFieldKey(value: string): value is FieldKey {
  return Object.hasOwn(STANDARD_FIELDS, value);
}

/** Absolute upper bound for any admin-configured text length. */
export const MAX_TEXT_LENGTH = 1000;

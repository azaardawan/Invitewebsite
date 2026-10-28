/**
 * The Field Library: standard invitation fields.
 *
 * Keys and types are defined in code because theme code renders them by key.
 * Labels and length limits are editable in Admin (stored in `field_definitions`);
 * the values here are the seeded defaults. Adding a field: add it here, then
 * `pnpm db:seed`. Every future theme can then use it.
 */
/** Letters per box of an `initials` field. */
export const INITIALS_MAX = 3;

/**
 * `date`: an upcoming event (today up to two years ahead). `birthdate`: a date of birth (up to three years back,
 * or up to a year ahead for an expected birth). `choice`: one of the field's fixed `options`. `initials`: two small
 * boxes, one letter (or a few) for each of the couple, stored as `first|second` (see `splitInitials`).
 */
export const FIELD_TYPES = ['text', 'longtext', 'date', 'birthdate', 'time', 'url', 'phone', 'choice', 'initials'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type I18nText = { ar: string; en: string; ckb?: string | null; bdn?: string | null };

export type FieldSpec = {
  type: FieldType;
  /** Default and upper bound for the admin-editable max length (text types). */
  maxLength?: number;
  label: I18nText;
  /** `choice` fields: the stored values (labels live in the message files under `fieldOptions`). */
  options?: readonly string[];
  /** The customer may leave it empty (the theme then works it out itself). Every other field is required. */
  optional?: boolean;
};

export const STANDARD_FIELDS = {
  person_1_name: { type: 'text', maxLength: 40, label: { ar: 'الاسم الأول', en: 'First name', ckb: 'ناوی یەکەم', bdn: 'ناڤێ ئێکێ' } },
  person_2_name: { type: 'text', maxLength: 40, label: { ar: 'الاسم الثاني', en: 'Second name', ckb: 'ناوی دووەم', bdn: 'ناڤێ دووێ' } },
  family_names: { type: 'longtext', maxLength: 150, label: { ar: 'أسماء العائلتين', en: 'Family names', ckb: 'ناوی هەردوو بنەماڵە', bdn: 'ناڤێن هەردوو بنەمالان' } },
  /** Each family on its own (e.g. the groom's and the bride's); the theme gives them their own place. */
  person_1_family: { type: 'text', maxLength: 60, label: { ar: 'عائلة العريس', en: "Groom's family", ckb: 'بنەماڵەی زاوا', bdn: 'مالباتا زاڤای' } },
  person_2_family: { type: 'text', maxLength: 60, label: { ar: 'عائلة العروس', en: "Bride's family", ckb: 'بنەماڵەی بووک', bdn: 'مالباتا بویکێ' } },
  // Graduation.
  /** The degree or achievement being celebrated (e.g. "Bachelor of Engineering"). */
  achievement: { type: 'text', maxLength: 80, label: { ar: 'الشهادة أو التخصص', en: 'Degree or achievement', ckb: 'بڕوانامە یان پسپۆڕی', bdn: 'بڕوانامە یان پسپۆری' } },
  /** Optional: when empty, the theme writes the year of the event (e.g. "Class of 2027"). */
  class_year: { type: 'text', maxLength: 12, optional: true, label: { ar: 'سنة الدفعة', en: 'Class year', ckb: 'ساڵی دەرچوون', bdn: 'ساڵا دەرچوونێ' } },
  event_date: { type: 'date', label: { ar: 'تاريخ المناسبة', en: 'Event date', ckb: 'بەرواری بۆنە', bdn: 'دیرۆکا ئاهەنگێ' } },
  event_time: { type: 'time', label: { ar: 'وقت المناسبة', en: 'Event time', ckb: 'کاتی بۆنە', bdn: 'دەمێ ئاهەنگێ' } },
  venue_name: { type: 'text', maxLength: 80, label: { ar: 'اسم المكان', en: 'Venue name', ckb: 'ناوی شوێن', bdn: 'ناڤێ جهی' } },
  venue_map_url: { type: 'url', label: { ar: 'رابط موقع المكان على الخريطة', en: 'Venue map link', ckb: 'بەستەری شوێن لەسەر نەخشە', bdn: 'لینکا جهی ل سەر نەخشەی' } },
  /** Optional: one box per person; when empty, the theme writes the first letters of the two names (first name first). */
  seal_initials: { type: 'initials', maxLength: INITIALS_MAX, optional: true, label: { ar: 'الأحرف الأولى على الختم', en: 'Initials on the seal', ckb: 'پیتە سەرەتاییەکان لەسەر مۆر', bdn: 'تیپێن ئێکێ ل سەر مۆرێ' } },
  invitation_message: { type: 'longtext', maxLength: 300, label: { ar: 'نص الدعوة', en: 'Invitation message', ckb: 'دەقی بانگهێشتنامە', bdn: 'نڤیسینا داخوازنامێ' } },
  // Newborn baby.
  baby_name: { type: 'text', maxLength: 40, label: { ar: 'اسم المولود', en: "Baby's name", ckb: 'ناوی منداڵ', bdn: 'ناڤێ زاروکی' } },
  baby_gender: { type: 'choice', options: ['boy', 'girl'], label: { ar: 'ولد أم بنت', en: 'Boy or girl', ckb: 'کوڕ یان کچ', bdn: 'کوڕ یان کچ' } },
  mother_name: { type: 'text', maxLength: 40, label: { ar: 'اسم الأم', en: "Mother's name", ckb: 'ناوی دایک', bdn: 'ناڤێ دەیکێ' } },
  father_name: { type: 'text', maxLength: 40, label: { ar: 'اسم الأب', en: "Father's name", ckb: 'ناوی باوک', bdn: 'ناڤێ بابی' } },
  birth_date: { type: 'birthdate', label: { ar: 'تاريخ الولادة', en: 'Date of birth', ckb: 'بەرواری لەدایکبوون', bdn: 'دیرۆکا ژدایکبوونێ' } },
  baby_quote: { type: 'text', maxLength: 120, label: { ar: 'عبارة قصيرة', en: 'A short quote', ckb: 'ڕستەیەکی کورت', bdn: 'ڕستەیەکا کورت' } },
} as const satisfies Record<string, FieldSpec>;

export type FieldKey = keyof typeof STANDARD_FIELDS;

/**
 * An `initials` field's two boxes, as stored (`first|second`). Either may be empty. A value without the bar (typed
 * before the field had two boxes) is one free text: `{ first: value, second: '', whole: true }`.
 */
export function splitInitials(value: string | undefined): { first: string; second: string; whole: boolean } {
  const v = value ?? '';
  const i = v.indexOf('|');
  return i < 0 ? { first: v, second: '', whole: v !== '' } : { first: v.slice(0, i), second: v.slice(i + 1), whole: false };
}

/** The stored value of two initials boxes ('' when both are empty). */
export function joinInitials(first: string, second: string): string {
  const a = first.replace(/\|/g, '').trim();
  const b = second.replace(/\|/g, '').trim();
  return a || b ? `${a}|${b}` : '';
}

/**
 * The invitation fields of a submitted form (`f.<key>` inputs). An `initials` field comes as two boxes,
 * `f.<key>.first` and `f.<key>.second`, joined into one value.
 */
export function fieldValuesFromForm(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  const boxes: Record<string, { first: string; second: string }> = {};
  for (const [k, v] of form.entries()) {
    if (!k.startsWith('f.') || typeof v !== 'string') continue;
    const m = /^f\.(.+)\.(first|second)$/.exec(k);
    if (m) (boxes[m[1]!] ??= { first: '', second: '' })[m[2] as 'first' | 'second'] = v;
    else values[k.slice(2)] = v;
  }
  for (const [key, b] of Object.entries(boxes)) values[key] = joinInitials(b.first, b.second);
  return values;
}

export const FIELD_KEYS = Object.keys(STANDARD_FIELDS) as FieldKey[];

export function isFieldKey(value: string): value is FieldKey {
  return Object.hasOwn(STANDARD_FIELDS, value);
}

/** Absolute upper bound for any admin-configured text length. */
export const MAX_TEXT_LENGTH = 1000;

/**
 * The place of the celebration. For a birthday it is the customer's choice (owner, 2026-10-28): off by default; ticking
 * "add the place" on the order form shows these fields (then required). Left off, the invitation and the cards have no
 * place at all. The form ticks it with `f.__place=1`; stored values have it whenever a place field is filled.
 */
export const PLACE_FIELDS = ['venue_name', 'venue_map_url'] as const satisfies readonly FieldKey[];
export const PLACE_TOGGLE = '__place';
const OPTIONAL_PLACE_OCCASIONS = ['birthday'];

/** Whether the place is the customer's choice for this occasion (section key). */
export function isPlaceOptional(occasionKey: string | null | undefined): boolean {
  return !!occasionKey && OPTIONAL_PLACE_OCCASIONS.includes(occasionKey);
}

/** Whether a form or stored values include the place: ticked, or any place field filled. */
export function placeChosen(values: Record<string, unknown>): boolean {
  return values[PLACE_TOGGLE] === '1' || PLACE_FIELDS.some((k) => typeof values[k] === 'string' && (values[k] as string).trim() !== '');
}

/** Whether the customer may leave this field empty. */
export function isOptionalField(key: string): boolean {
  return isFieldKey(key) && (STANDARD_FIELDS[key] as FieldSpec).optional === true;
}

/** The fixed options of a `choice` field (empty for other fields). */
export function fieldOptions(key: string): readonly string[] {
  return isFieldKey(key) ? ((STANDARD_FIELDS[key] as FieldSpec).options ?? []) : [];
}

/** The names an invitation is "for": the couple, or else the baby (for slugs, lists and titles). */
export function invitationNames(values: Readonly<Partial<Record<string, string | undefined>>>): string[] {
  const couple = [values.person_1_name, values.person_2_name].filter((n): n is string => Boolean(n));
  return couple.length ? couple : [values.baby_name].filter((n): n is string => Boolean(n));
}

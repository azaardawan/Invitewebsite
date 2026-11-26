/**
 * The event a wedding or engagement invitation is for, when it isn't the section's own (owner, 2026-11-26): a Nishani, a
 * Henna night, or the customer's own words ("Our Nikah ceremony"). Every line of the design that names the wedding (or
 * the engagement) names this event instead: on the invitation, the printed card and the link preview.
 *
 * The platform turns the customer's choice into `EventWords` in the invitation's language (`eventWords`); designs map
 * their own lines onto these phrases (`props.eventWording`).
 */
export const EVENT_KINDS = ['nishani', 'henna', 'custom'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];
/** The sections whose designs offer the choice (owner: weddings and engagements only, for now). */
export const EVENT_KIND_SECTIONS = ['wedding', 'engagement'] as const;
/**
 * The first version of each design that shows the event chosen (`props.eventWording`); later versions are copies of it.
 * The choice is only offered on these (owner, 2026-11-26: offered on an older version it changed nothing).
 */
export const EVENT_WORDING_SINCE: Readonly<Record<string, number>> = {
  'burgundy-lace': 5,
  'delal-bridge': 3,
  'erbil-hewler': 3,
  'espresso-ivory': 4,
  'golden-stitch': 2,
  'vintage-love-letters': 6,
  'winter-flower': 3,
};

/** Whether this design version shows the event chosen. */
export function showsEventWording(themeKey: string | null | undefined, version: number | null | undefined): boolean {
  const since = themeKey ? EVENT_WORDING_SINCE[themeKey] : undefined;
  return since !== undefined && typeof version === 'number' && version >= since;
}

/** The customer's own event name: one short line. */
export const EVENT_NAME_MAX = 40;

export type EventWords = {
  /** The event's name on its own: «Henna night». */
  name: string;
  /** Before the couple's names: «The henna night of». */
  ofThe: string;
  /** The invitation line: «You are cordially invited to the henna night of» (designs may show it in capitals). */
  invitedTo: string;
  /** The couple's own: «Our henna night» (countdowns, closing lines). */
  ours: string;
  /** «On the occasion of our henna night» (Arabic-style opening lines). */
  onOccasion: string;
  /** «Henna night invitation». */
  invitation: string;
  /** «Henna night details». */
  details: string;
  /** The keepsake's subtitle: «Messages from family and friends on our henna night». */
  keepsake: string;
  /** The name in Latin letters, for artwork lettered in English in every language («Henna night»; own words as written). */
  latin: string;
};

type Lang = 'ar' | 'en' | 'ckb' | 'bdn';

const FIXED: Record<'nishani' | 'henna', Record<Lang, Omit<EventWords, 'latin'>>> = {
  nishani: {
    ar: {
      name: 'حفل النيشان',
      ofThe: 'حفل نيشان',
      invitedTo: 'ندعوكم لمشاركتنا\nفرحة حفل النيشان',
      ours: 'حفل نيشاننا',
      onOccasion: 'بمناسبة حفل نيشاننا',
      invitation: 'دعوة حفل النيشان',
      details: 'تفاصيل حفل النيشان',
      keepsake: 'رسائل الأهل والأحبة في يوم نيشاننا',
    },
    en: {
      name: 'Nishani',
      ofThe: 'The Nishani of',
      invitedTo: 'You are cordially invited\nto the Nishani of',
      ours: 'Our Nishani',
      onOccasion: 'To celebrate our Nishani',
      invitation: 'Nishani invitation',
      details: 'Nishani details',
      keepsake: 'Messages from family and friends on our Nishani',
    },
    ckb: {
      name: 'ئاهەنگی نیشانی',
      ofThe: 'ئاهەنگی نیشانیی',
      invitedTo: 'بانگهێشتتان دەکەین بۆ بەشداریکردن\nلە ئاهەنگی نیشانیمان',
      ours: 'ئاهەنگی نیشانیمان',
      onOccasion: 'بە بۆنەی نیشانیمان',
      invitation: 'بانگهێشتنامەی نیشانی',
      details: 'زانیارییەکانی ئاهەنگی نیشانی',
      keepsake: 'نامەی خێزان و خۆشەویستان لە ڕۆژی نیشانیماندا',
    },
    bdn: {
      name: 'ئاهەنگا نیشانیێ',
      ofThe: 'ئاهەنگا نیشانیا',
      invitedTo: 'مە هوین داخواز کرینە بۆ پشکداریێ\nد ئاهەنگا نیشانیا مە دا',
      ours: 'ئاهەنگا نیشانیا مە',
      onOccasion: 'ب بۆنا نیشانیا مە',
      invitation: 'داخوازناما نیشانیێ',
      details: 'زانیاریێن ئاهەنگا نیشانیێ',
      keepsake: 'نامێن مالباتێ و هەڤالان د ڕۆژا نیشانیا مە دا',
    },
  },
  henna: {
    ar: {
      name: 'ليلة الحنّة',
      ofThe: 'ليلة حنّة',
      invitedTo: 'ندعوكم لمشاركتنا\nفرحة ليلة الحنّة',
      ours: 'ليلة حنّتنا',
      onOccasion: 'بمناسبة ليلة حنّتنا',
      invitation: 'دعوة ليلة الحنّة',
      details: 'تفاصيل ليلة الحنّة',
      keepsake: 'رسائل الأهل والأحبة في ليلة حنّتنا',
    },
    en: {
      name: 'Henna night',
      ofThe: 'The henna night of',
      invitedTo: 'You are cordially invited\nto the henna night of',
      ours: 'Our henna night',
      onOccasion: 'To celebrate our henna night',
      invitation: 'Henna night invitation',
      details: 'Henna night details',
      keepsake: 'Messages from family and friends on our henna night',
    },
    ckb: {
      name: 'شەوی خەنەبەندان',
      ofThe: 'شەوی خەنەبەندانی',
      invitedTo: 'بانگهێشتتان دەکەین بۆ بەشداریکردن\nلە شەوی خەنەبەندانمان',
      ours: 'شەوی خەنەبەندانمان',
      onOccasion: 'بە بۆنەی شەوی خەنەبەندانمان',
      invitation: 'بانگهێشتنامەی شەوی خەنەبەندان',
      details: 'زانیارییەکانی شەوی خەنەبەندان',
      keepsake: 'نامەی خێزان و خۆشەویستان لە شەوی خەنەبەندانماندا',
    },
    bdn: {
      name: 'شەڤا خەنێ',
      ofThe: 'شەڤا خەنا',
      invitedTo: 'مە هوین داخواز کرینە بۆ پشکداریێ\nد شەڤا خەنا مە دا',
      ours: 'شەڤا خەنا مە',
      onOccasion: 'ب بۆنا شەڤا خەنا مە',
      invitation: 'داخوازناما شەڤا خەنێ',
      details: 'زانیاریێن شەڤا خەنێ',
      keepsake: 'نامێن مالباتێ و هەڤالان د شەڤا خەنا مە دا',
    },
  },
};

/** The customer's own words: the name everywhere, inside each language's own frame. */
function customWords(name: string, lang: Lang): EventWords {
  const frames: Record<Lang, Omit<EventWords, 'name' | 'ofThe' | 'ours' | 'invitation' | 'details' | 'latin'>> = {
    ar: {
      invitedTo: `ندعوكم لمشاركتنا\n${name}`,
      onOccasion: `بمناسبة ${name}`,
      keepsake: 'رسائل الأهل والأحبة',
    },
    en: {
      invitedTo: `You are cordially invited\nto ${name}`,
      onOccasion: name,
      keepsake: 'Messages from family and friends',
    },
    ckb: {
      invitedTo: `بانگهێشتتان دەکەین بۆ\n${name}`,
      onOccasion: `بە بۆنەی ${name}`,
      keepsake: 'نامەی خێزان و خۆشەویستان',
    },
    bdn: {
      invitedTo: `مە هوین داخواز کرینە بۆ\n${name}`,
      onOccasion: `ب بۆنا ${name}`,
      keepsake: 'نامێن مالباتێ و هەڤالان',
    },
  };
  return {
    name,
    ofThe: name,
    ours: name,
    invitation: name,
    details: name,
    latin: name,
    ...frames[lang],
  };
}

export function isEventKind(v: unknown): v is EventKind {
  return typeof v === 'string' && (EVENT_KINDS as readonly string[]).includes(v);
}

/** The customer's own event name as stored: one line, at most EVENT_NAME_MAX letters, or null. */
export function cleanEventName(v: string | null | undefined): string | null {
  const s = (v ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001f<>]/g, '')
    .trim();
  return s ? s.slice(0, EVENT_NAME_MAX) : null;
}

/** The phrases for an invitation's event, or null for the section's own (a wedding or an engagement). */
export function eventWords(kind: string | null | undefined, name: string | null | undefined, locale: string): EventWords | null {
  if (!isEventKind(kind)) return null;
  const lang: Lang = locale === 'en' || locale === 'ckb' || locale === 'bdn' ? locale : 'ar';
  if (kind !== 'custom') return { ...FIXED[kind][lang], latin: FIXED[kind].en.name };
  const own = cleanEventName(name);
  return own ? customWords(own, lang) : null;
}

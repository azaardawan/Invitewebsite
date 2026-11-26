import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own wording, as the owner drew the pages (English), in the four invitation languages. Platform strings
 * (form, buttons, countdown units, date/time/venue labels) come from `props.labels`; the customer's text from fields
 * and `props.wording`. The verse and its reference always stay in Arabic; the English meaning shows in English
 * invitations only. Kurdish: auto-approved (owner rule 2026-10-20), listed in docs/translations/KURDISH_REVIEW.md.
 */
const ar = {
  togetherWith: 'بحضور عائلتيهما',
  groomFamily: 'عائلة العريس',
  brideFamily: 'عائلة العروس',
  request: 'يتشرّفون بدعوتكم لحضور حفل {event}',
  /** Ar-Rum 30:21. Never changed by customers. */
  verse: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
  verseRef: 'سورة الروم · الآية ٢١',
  verseTranslation: '',
  noteTitle: 'رسالة منّا',
  detailsTitle: 'تفاصيل الحفل',
  countdownTitle: 'اليوم الكبير بعد',
  congratsTitle: 'رسائل التهنئة',
  congratsIntro: 'اترك تهنئتك وأمنياتك الصادقة للعروسين',
  messagePlaceholder: 'اكتب رسالتك…',
  thanks: 'شكرًا لكونكم جزءًا من يومنا المميّز.',
  weddingOf: 'حفل {event}',
  withLoveShort: 'مع الحب',
  skipFilm: 'تخطّي',
  soundOn: 'تشغيل الصوت',
  keepsakeSub: 'تهاني الأهل والأحبة',
  withLove: 'مع كلّ حبّنا،',
  tapForMap: 'اضغط لفتح الخريطة',
} as const;

export type Copy = { [K in keyof typeof ar]: string };

const en: Copy = {
  togetherWith: 'Together with their families',
  groomFamily: 'The Family of the Groom',
  brideFamily: 'The Family of the Bride',
  request: 'Request the honor of your presence at the {event} celebration of',
  verse: ar.verse,
  verseRef: 'Surah Ar-Rum · Verse 21',
  verseTranslation:
    'And among His signs is that He created for you spouses from among yourselves so that you may find tranquility in them, and He placed between you affection and mercy.',
  noteTitle: 'A Letter from Us',
  detailsTitle: '{Event} Details',
  countdownTitle: 'The Big Day In',
  congratsTitle: 'Congratulations Messages',
  congratsIntro: 'Leave your congratulations and heartfelt wishes for the couple',
  messagePlaceholder: 'Write your message…',
  thanks: 'Thank you for being a part of our special day.',
  weddingOf: 'The {Event} of',
  withLoveShort: 'With love',
  skipFilm: 'Skip',
  soundOn: 'Tap for sound',
  keepsakeSub: 'Wishes from family and friends',
  withLove: 'With all our love,',
  tapForMap: 'Tap to open the map',

};

const ckb: Copy = {
  togetherWith: 'لەگەڵ هەردوو بنەماڵەکەیان',
  groomFamily: 'بنەماڵەی زاوا',
  brideFamily: 'بنەماڵەی بووک',
  request: 'شانازی بە بانگهێشتکردنتان دەکەن بۆ ئاهەنگی {event}',
  verse: ar.verse,
  verseRef: ar.verseRef,
  verseTranslation: '',
  noteTitle: 'نامەیەک لە ئێمەوە',
  detailsTitle: 'وردەکاریی ئاهەنگ',
  countdownTitle: 'ڕۆژە گەورەکە دوای',
  congratsTitle: 'نامەکانی پیرۆزبایی',
  congratsIntro: 'پیرۆزبایی و هیوا دڵسۆزەکانت بۆ بووک و زاوا بنووسە',
  messagePlaceholder: 'نامەکەت بنووسە…',
  thanks: 'سوپاس بۆ ئەوەی بەشێک بوون لە ڕۆژە تایبەتەکەمان.',
  weddingOf: 'ئاهەنگی {event}',
  withLoveShort: 'بە خۆشەویستییەوە',
  skipFilm: 'تێپەڕاندن',
  soundOn: 'دەنگ لێبدە',
  keepsakeSub: 'پیرۆزبایی خێزان و خۆشەویستان',
  withLove: 'بە هەموو خۆشەویستیمانەوە،',
  tapForMap: 'بۆ کردنەوەی نەخشەکە دابگرە',

};

const bdn: Copy = {
  togetherWith: 'دگەل هەردوو مالباتێن وان',
  groomFamily: 'مالباتا زاڤای',
  brideFamily: 'مالباتا بویکێ',
  request: 'شانازیێ ب داخوازکرنا هەوە دکەن بۆ ئاهەنگا {event}',
  verse: ar.verse,
  verseRef: ar.verseRef,
  verseTranslation: '',
  noteTitle: 'نامەیەک ژ مە',
  detailsTitle: 'هوورگلیێن ئاهەنگێ',
  countdownTitle: 'رۆژا مەزن پشتی',
  congratsTitle: 'نامێن پیرۆزباهیێ',
  congratsIntro: 'پیرۆزباهی و هیڤیێن خۆ یێن دلسۆز بۆ بویک و زاڤای بنڤیسە',
  messagePlaceholder: 'نامەیا خۆ بنڤیسە…',
  thanks: 'سوپاس بۆ هندێ کو هوین بەشەک بوون ژ رۆژا مە یا تایبەت.',
  weddingOf: 'ئاهەنگا {event}',
  withLoveShort: 'ب ڤیان',
  skipFilm: 'دەرباز بکە',
  soundOn: 'دەنگی لێبدە',
  keepsakeSub: 'پیرۆزباهیێن مالباتێ و هەڤالان',
  withLove: 'ب هەمی ڤیانا مە،',
  tapForMap: 'بۆ ڤەکرنا نەخشەیێ پەنجێ لێ بدە',

};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb, bdn };

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

/**
 * The occasion's name in a line (owner, 2026-11-26: the customer may call it something other than "wedding", wording
 * `eventName`): `{event}` as written, `{Event}` with capital initials (English titles).
 */
export function withEvent(text: string, event: string | undefined, fallback: string): string {
  const name = (event ?? '').trim() || fallback;
  const title = name.replace(/(^|\s)(\p{Ll})/gu, (_, sp: string, c: string) => sp + c.toUpperCase());
  return text.replaceAll('{event}', name).replaceAll('{Event}', title);
}

/** The default occasion name in each language (the manifest's `eventName` wording). */
export const EVENT_DEFAULT: Record<InvitationLocale, string> = { ar: 'زفاف', en: 'wedding', ckb: 'زەماوەند', bdn: 'داوەت' };

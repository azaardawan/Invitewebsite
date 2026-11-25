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
  request: 'يتشرّفون بدعوتكم لحضور حفل زفاف',
  verseTitle: 'آية كريمة',
  /** Ar-Rum 30:21. Never changed by customers. */
  verse: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
  verseRef: 'سورة الروم · الآية ٢١',
  verseTranslation: '',
  noteTitle: 'كلمة منّا إليكم',
  detailsTitle: 'تفاصيل الحفل',
  countdownTitle: 'العدّ التنازلي',
  countdownSub: 'لحفل زفافنا',
  untilWeSay: 'حتى نقول',
  iDo: 'نعم',
  congratsTitle: 'رسائل التهنئة',
  congratsIntro: 'اترك تهنئتك وأمنياتك الصادقة للعروسين',
  messagePlaceholder: 'اكتب رسالتك…',
  thanks: 'شكرًا لكونكم جزءًا من يومنا المميّز.',
  weddingOf: 'حفل زفاف',
  skipFilm: 'تخطّي',
  keepsakeSub: 'تهاني الأهل والأحبة',
} as const;

export type Copy = { [K in keyof typeof ar]: string };

const en: Copy = {
  togetherWith: 'Together with their families',
  groomFamily: 'The Family of the Groom',
  brideFamily: 'The Family of the Bride',
  request: 'Request the honor of your presence at the wedding celebration of',
  verseTitle: 'Quran Verse',
  verse: ar.verse,
  verseRef: 'Surah Ar-Rum · Verse 21',
  verseTranslation:
    'And among His signs is that He created for you spouses from among yourselves so that you may find tranquility in them, and He placed between you affection and mercy.',
  noteTitle: 'A Personal Note From Us',
  detailsTitle: 'The Wedding Details',
  countdownTitle: 'Countdown',
  countdownSub: 'To Our Wedding',
  untilWeSay: 'Until We Say',
  iDo: 'I Do',
  congratsTitle: 'Congratulations Messages',
  congratsIntro: 'Leave your congratulations and heartfelt wishes for the couple',
  messagePlaceholder: 'Write your message…',
  thanks: 'Thank you for being a part of our special day.',
  weddingOf: 'The Wedding of',
  skipFilm: 'Skip',
  keepsakeSub: 'Wishes from family and friends',
};

const ckb: Copy = {
  togetherWith: 'لەگەڵ هەردوو بنەماڵەکەیان',
  groomFamily: 'بنەماڵەی زاوا',
  brideFamily: 'بنەماڵەی بووک',
  request: 'شانازی بە بانگهێشتکردنتان دەکەن بۆ ئاهەنگی زەماوەندی',
  verseTitle: 'ئایەتی پیرۆز',
  verse: ar.verse,
  verseRef: ar.verseRef,
  verseTranslation: '',
  noteTitle: 'چەند وشەیەک لە ئێمەوە',
  detailsTitle: 'وردەکاریی ئاهەنگ',
  countdownTitle: 'ژماردنی پێچەوانە',
  countdownSub: 'بۆ زەماوەندەکەمان',
  untilWeSay: 'تا دەڵێین',
  iDo: 'بەڵێ',
  congratsTitle: 'نامەکانی پیرۆزبایی',
  congratsIntro: 'پیرۆزبایی و هیوا دڵسۆزەکانت بۆ بووک و زاوا بنووسە',
  messagePlaceholder: 'نامەکەت بنووسە…',
  thanks: 'سوپاس بۆ ئەوەی بەشێک بوون لە ڕۆژە تایبەتەکەمان.',
  weddingOf: 'زەماوەندی',
  skipFilm: 'تێپەڕاندن',
  keepsakeSub: 'پیرۆزبایی خێزان و خۆشەویستان',
};

const bdn: Copy = {
  togetherWith: 'دگەل هەردوو مالباتێن وان',
  groomFamily: 'مالباتا زاڤای',
  brideFamily: 'مالباتا بویکێ',
  request: 'شانازیێ ب داخوازکرنا هەوە دکەن بۆ ئاهەنگا داوەتا',
  verseTitle: 'ئایەتا پیرۆز',
  verse: ar.verse,
  verseRef: ar.verseRef,
  verseTranslation: '',
  noteTitle: 'چەند پەیڤەک ژ مە',
  detailsTitle: 'هوورگلیێن ئاهەنگێ',
  countdownTitle: 'ژمارتنا بەرەڤاژی',
  countdownSub: 'بۆ داوەتا مە',
  untilWeSay: 'هەتا دبێژین',
  iDo: 'بەلێ',
  congratsTitle: 'نامێن پیرۆزباهیێ',
  congratsIntro: 'پیرۆزباهی و هیڤیێن خۆ یێن دلسۆز بۆ بویک و زاڤای بنڤیسە',
  messagePlaceholder: 'نامەیا خۆ بنڤیسە…',
  thanks: 'سوپاس بۆ هندێ کو هوین بەشەک بوون ژ رۆژا مە یا تایبەت.',
  weddingOf: 'داوەتا',
  skipFilm: 'دەرباز بکە',
  keepsakeSub: 'پیرۆزباهیێن مالباتێ و هەڤالان',
};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb, bdn };

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

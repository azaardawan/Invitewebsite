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
  /** Ar-Rum 30:21. Never changed by customers. */
  verse: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
  verseRef: 'سورة الروم · الآية ٢١',
  verseTranslation: '',
  noteTitle: 'رسالة منّا',
  detailsTitle: 'تفاصيل الزفاف',
  countdownTitle: 'اليوم الكبير بعد',
  congratsTitle: 'رسائل التهنئة',
  congratsIntro: 'اترك تهنئتك وأمنياتك الصادقة للعروسين',
  messagePlaceholder: 'اكتب رسالتك…',
  thanks: 'شكرًا لكونكم جزءًا من يومنا المميّز.',
  weddingOf: 'حفل زفاف',
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
  request: 'Request the honor of your presence at the wedding celebration of',
  verse: ar.verse,
  verseRef: 'Surah Ar-Rum · Verse 21',
  verseTranslation:
    'And among His signs is that He created for you spouses from among yourselves so that you may find tranquility in them, and He placed between you affection and mercy.',
  noteTitle: 'A Letter from Us',
  detailsTitle: 'Wedding Details',
  countdownTitle: 'The Big Day In',
  congratsTitle: 'Congratulations Messages',
  congratsIntro: 'Leave your congratulations and heartfelt wishes for the couple',
  messagePlaceholder: 'Write your message…',
  thanks: 'Thank you for being a part of our special day.',
  weddingOf: 'The Wedding of',
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
  request: 'شانازی بە بانگهێشتکردنتان دەکەن بۆ ئاهەنگی زەماوەندی',
  verse: ar.verse,
  verseRef: ar.verseRef,
  verseTranslation: '',
  noteTitle: 'نامەیەک لە ئێمەوە',
  detailsTitle: 'وردەکاریی زەماوەند',
  countdownTitle: 'ڕۆژە گەورەکە دوای',
  congratsTitle: 'نامەکانی پیرۆزبایی',
  congratsIntro: 'پیرۆزبایی و هیوا دڵسۆزەکانت بۆ بووک و زاوا بنووسە',
  messagePlaceholder: 'نامەکەت بنووسە…',
  thanks: 'سوپاس بۆ ئەوەی بەشێک بوون لە ڕۆژە تایبەتەکەمان.',
  weddingOf: 'زەماوەندی',
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
  request: 'شانازیێ ب داخوازکرنا هەوە دکەن بۆ ئاهەنگا داوەتا',
  verse: ar.verse,
  verseRef: ar.verseRef,
  verseTranslation: '',
  noteTitle: 'نامەیەک ژ مە',
  detailsTitle: 'هوورگلیێن داوەتێ',
  countdownTitle: 'رۆژا مەزن پشتی',
  congratsTitle: 'نامێن پیرۆزباهیێ',
  congratsIntro: 'پیرۆزباهی و هیڤیێن خۆ یێن دلسۆز بۆ بویک و زاڤای بنڤیسە',
  messagePlaceholder: 'نامەیا خۆ بنڤیسە…',
  thanks: 'سوپاس بۆ هندێ کو هوین بەشەک بوون ژ رۆژا مە یا تایبەت.',
  weddingOf: 'داوەتا',
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

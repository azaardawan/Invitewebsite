import type { InvitationLocale } from '@/theme-sdk';

/**
 * The theme's own wording. Platform strings (buttons, form, countdown units, errors) come from
 * `props.labels`; the customer's content comes from fields. The Kurdish lines are the owner-approved
 * wording already shipped with Olive Ring Box (docs/translations/KURDISH_FULL_LIST.md rows 141–148) for the
 * same Arabic sentences; the verse and its reference always stay in Arabic.
 */
const ar = {
  /** Ar-Rum 30:21, the verse on the cream oval page. Never changed by customers. */
  verse: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
  verseRef: 'سورة الروم، الآية ٢١',
  /** Shown under the verse in English invitations only. */
  verseTranslation: '',
  countdownTitle: 'يبدأ الحفل بعد',
  formIntro: 'يسعدنا أن نعرف إن كنت ستشاركنا فرحتنا.',
  closing: 'شكرًا لمشاركتكم فرحتنا',
  closingSub: 'حضوركم يتمّ سعادتنا',
  keepsakeSubtitle: 'تهاني الأهل والأحبة',
  keepsakeClosing: 'مع خالص الشكر لكل من شاركنا الفرح',
} as const;

export type Copy = { [K in keyof typeof ar]: string };

const en: Copy = {
  verse: ar.verse,
  verseRef: 'Surah Ar-Rum, 30:21',
  verseTranslation:
    'And among His signs is that He created for you spouses from among yourselves, that you may find tranquillity in them; and He placed between you affection and mercy.',
  countdownTitle: 'The celebration begins in',
  formIntro: 'We would love to know if you can join us.',
  closing: 'Thank you for sharing our joy',
  closingSub: 'Your presence completes our happiness',
  keepsakeSubtitle: 'Wishes from family and friends',
  keepsakeClosing: 'With heartfelt thanks to everyone who shared our joy',
};

const ckb: Copy = {
  verse: ar.verse,
  verseRef: ar.verseRef,
  verseTranslation: '',
  countdownTitle: 'ئاهەنگەکە دەست پێدەکات دوای',
  formIntro: 'خۆشحاڵ دەبین بزانین ئایا بەشداری خۆشیمان دەکەیت.',
  closing: 'سوپاس بۆ بەشداریکردنتان لە خۆشیمان',
  closingSub: 'ئامادەبوونتان خۆشیمان تەواو دەکات',
  keepsakeSubtitle: 'پیرۆزبایی خێزان و خۆشەویستان',
  keepsakeClosing: 'بە سوپاسێکی بێپایان بۆ هەموو ئەوانەی بەشداری خۆشیمان بوون',
};

const bdn: Copy = {
  verse: ar.verse,
  verseRef: ar.verseRef,
  verseTranslation: '',
  countdownTitle: 'ئاهەنگ دێ دەست پێکەت پشتی',
  formIntro: 'دێ دلخۆش بین بزانین کا تو دێ پشکداریێ د شاهیا مە دا کەی.',
  closing: 'سوپاس بۆ پشکداریا هەوە د شاهیا مە دا',
  closingSub: 'ئامادەبوونا هەوە شاهیا مە تەمام دکەت',
  keepsakeSubtitle: 'پیرۆزباهیێن مالباتێ و هەڤالان',
  keepsakeClosing: 'ب سوپاسەکا زۆر بۆ هەمی ئەوێن پشکداری د شاهیا مە دا کری',
};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb, bdn };

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

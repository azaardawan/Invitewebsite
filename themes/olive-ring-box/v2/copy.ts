import type { InvitationLocale } from '@/theme-sdk';

/**
 * The theme's own decorative wording. Every platform string (buttons, form,
 * countdown units, errors) comes from `props.labels`; customer content comes
 * from fields. Kurdish wording approved by the owner (docs/translations/KURDISH_FULL_LIST.md
 * rows 141–148). The basmala always stays in Arabic.
 */
const ar = {
  openHint: 'اضغط لفتح علبة الدعوة',
  basmala: 'بسم الله الرحمن الرحيم',
  and: 'و',
  countdownTitle: 'يبدأ الحفل بعد',
  formIntro: 'يسعدنا أن نعرف إن كنت ستشاركنا فرحتنا.',
  closing: 'شكرًا لمشاركتكم فرحتنا',
  closingSub: 'حضوركم يتمّ سعادتنا',
  keepsakeSubtitle: 'تهاني الأهل والأحبة',
  keepsakeClosing: 'مع خالص الشكر لكل من شاركنا الفرح',
} as const;

export type Copy = { [K in keyof typeof ar]: string };

const en: Copy = {
  openHint: 'Tap to open the invitation box',
  basmala: 'In the name of Allah, the Most Gracious, the Most Merciful',
  and: '&',
  countdownTitle: 'The celebration begins in',
  formIntro: 'We would love to know if you can join us.',
  closing: 'Thank you for sharing our joy',
  closingSub: 'Your presence completes our happiness',
  keepsakeSubtitle: 'Wishes from family and friends',
  keepsakeClosing: 'With heartfelt thanks to everyone who shared our joy',
};

const ckb: Copy = {
  openHint: 'دەستی لێ بدە بۆ کردنەوەی سندوقی بانگهێشتنامە',
  basmala: ar.basmala,
  and: 'و',
  countdownTitle: 'ئاهەنگەکە دەست پێدەکات دوای',
  formIntro: 'خۆشحاڵ دەبین بزانین ئایا بەشداری خۆشیمان دەکەیت.',
  closing: 'سوپاس بۆ بەشداریکردنتان لە خۆشیمان',
  closingSub: 'ئامادەبوونتان خۆشیمان تەواو دەکات',
  keepsakeSubtitle: 'پیرۆزبایی خێزان و خۆشەویستان',
  keepsakeClosing: 'بە سوپاسێکی بێپایان بۆ هەموو ئەوانەی بەشداری خۆشیمان بوون',
};

const bdn: Copy = {
  openHint: 'دەستێ خۆ لێ بدە بۆ ڤەکرنا سندوقا داخوازنامێ',
  basmala: ar.basmala,
  and: 'و',
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

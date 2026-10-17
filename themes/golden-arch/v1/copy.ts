import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own lines. Platform strings (buttons, form, countdown units, errors) come from `props.labels`; the
 * customer's content comes from fields, and the poster's script line ("Reception to follow!") is the changeable
 * `followLine` (manifest wording). The Kurdish is the owner's approved
 * wording (docs/translations/KURDISH_REVIEW.md, batch 35).
 */
const ar = {
  /** Over the graduate's name on the closed poster. */
  celebrating: 'نحتفل بتخرّج',
  classOf: 'دفعة',
  portraitLead: 'لحظة فخر',
  portraitTitle: 'تعب السنين\nيزهر اليوم',
  portraitNote: 'لكل من آمن بالحلم، ورافق الطريق خطوة بخطوة.',
  countdownLead: 'حتى نحتفل معاً',
  countdownTitle: 'نعدّ الأيام',
  detailsLead: 'احفظوا الموعد',
  detailsTitle: 'تفاصيل الاحتفال',
  placeLabel: 'المكان',
  replyLead: 'مكانكم بيننا',
  replyTitle: 'تأكيد الحضور',
  replyIntro: 'تكتمل الفرحة بحضوركم.',
  guestbook: 'كلمات للخرّيج',
  closing: 'المستقبل لك\nفانطلق بثقة',
  keepsakeClosing: 'شكراً من القلب لكل من شاركنا فرحة التخرّج',
} as const;

export type Copy = { [K in keyof typeof ar]: string };

const en: Copy = {
  celebrating: 'CELEBRATING THE GRADUATION OF',
  classOf: 'CLASS OF',
  portraitLead: 'A PROUD MOMENT',
  portraitTitle: 'Years of work,\nin full bloom',
  portraitNote: 'For everyone who believed in the dream and walked the road with us.',
  countdownLead: 'UNTIL WE CELEBRATE',
  countdownTitle: 'Counting the days',
  detailsLead: 'SAVE THE DATE',
  detailsTitle: 'The celebration',
  placeLabel: 'THE PLACE',
  replyLead: 'A PLACE FOR YOU',
  replyTitle: 'Kindly reply',
  replyIntro: 'It wouldn’t be the same without you.',
  guestbook: 'Words for the graduate',
  closing: 'The future\nbelongs to you',
  keepsakeClosing: 'With heartfelt thanks to everyone who shared this day',
};

const ckb: Copy = {
  celebrating: 'ئاهەنگ دەگێڕین بۆ دەرچوونی',
  classOf: 'دەرچووی ساڵی',
  portraitLead: 'ساتێکی شانازی',
  portraitTitle: 'ماندووبوونی ساڵان\nئەمڕۆ گوڵ دەکات',
  portraitNote: 'بۆ هەموو ئەوانەی باوەڕیان بە خەونەکە هەبوو و هەنگاو بە هەنگاو لەگەڵمان بوون.',
  countdownLead: 'تا پێکەوە ئاهەنگ دەگێڕین',
  countdownTitle: 'ڕۆژەکان دەژمێرین',
  detailsLead: 'کاتەکە لەبیر مەکەن',
  detailsTitle: 'زانیارییەکانی ئاهەنگ',
  placeLabel: 'شوێن',
  replyLead: 'شوێنتان لەناوماندایە',
  replyTitle: 'دڵنیاکردنەوەی ئامادەبوون',
  replyIntro: 'خۆشیمان بە ئامادەبوونتان تەواو دەبێت.',
  guestbook: 'وشەگەلێک بۆ دەرچوو',
  closing: 'داهاتوو هی تۆیە\nبە متمانەوە بڕۆ پێش',
  keepsakeClosing: 'لە دڵەوە سوپاس بۆ هەموو ئەوانەی بەشداری خۆشیی دەرچوونمان بوون',
};

const bdn: Copy = {
  celebrating: 'ئەم ئاهەنگێ دگێڕین بۆ دەرچوونا',
  classOf: 'دەرچوویێ ساڵا',
  portraitLead: 'دەمەکێ سەربلندیێ',
  portraitTitle: 'وەستیانا ساڵان\nئەڤرۆ گول ددەت',
  portraitNote: 'بۆ هەمی ئەوێن باوەری ب خەونێ هەی و گاڤ ب گاڤ دگەل مە بووین.',
  countdownLead: 'هەتا پێکڤە ئاهەنگێ دگێڕین',
  countdownTitle: 'ئەم ڕۆژان دهژمێرین',
  detailsLead: 'دەمی ژبیر نەکەن',
  detailsTitle: 'زانیاریێن ئاهەنگێ',
  placeLabel: 'جه',
  replyLead: 'جهێ هەوە د ناڤبەرا مە دایە',
  replyTitle: 'پشتڕاستکرنا ئامادەبوونێ',
  replyIntro: 'شاهیا مە ب ئامادەبوونا هەوە تەمام دبیت.',
  guestbook: 'پەیڤەک بۆ دەرچووی',
  closing: 'پاشەڕۆژ یا تەیە\nب باوەری بچە پێش',
  keepsakeClosing: 'ژ دل سوپاس بۆ هەمی ئەوێن پشکداری د شاهیا دەرچوونێ دا کری',
};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb, bdn };

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

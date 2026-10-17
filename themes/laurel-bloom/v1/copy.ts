import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own lines (from the designer's hand-off, docs/themes/laurel-bloom/). Platform strings (buttons, form,
 * countdown units, errors) come from `props.labels`; the customer's content comes from fields. The Kurdish is the
 * owner's approved wording (docs/translations/KURDISH_REVIEW.md, batch 35).
 */
const ar = {
  invited: 'ندعوكم لمشاركتنا فرحة التخرّج',
  graduation: 'فرحة التخرّج',
  celebration: 'وبداية الحكاية',
  classOf: 'دفعة',
  viewDetails: 'تفاصيل الاحتفال',
  reply: 'تأكيد الحضور',
  newChapter: 'فصل جديد من الحكاية',
  storyTitle: 'جذورٌ من الأحلام\nوبداياتٌ تزهر',
  /** Under the second photograph. */
  memories: 'لحظة من رحلة لا تُنسى',
  storyCopy: 'لكل ليلة سهر، ولكل إنجاز صغير، ولكل من كان جزءاً من هذه الرحلة. تكتمل فرحة هذا اليوم بمشاركتكم.',
  countdownLabel: 'حتى نحتفل معاً',
  countdownTitle: 'نعدّ الأيام لفرحتنا',
  saveDate: 'احفظوا هذا الموعد',
  detailsTitle: 'يوم يستحق أن نحتفل به',
  timeLabel: 'الساعة',
  placeLabel: 'مكان الاحتفال',
  presence: 'أجمل ما في هذا الإنجاز أن نشاركه معكم.',
  rsvpLabel: 'مكانكم بيننا',
  rsvpTitle: 'شاركونا الفرحة',
  rsvpIntro: 'تكتمل فرحتنا بحضوركم.',
  guestbook: 'كلمات لبداية جديدة',
  closingLabel: 'بكل الامتنان والفرح',
  closing: 'لأحلام أكبر\nوبدايات أجمل',
  keepsakeClosing: 'شكراً من القلب لكل من شاركنا فرحة التخرّج',
} as const;

export type Copy = { [K in keyof typeof ar]: string };

const en: Copy = {
  invited: 'YOU’RE INVITED TO CELEBRATE',
  graduation: 'Graduation',
  celebration: 'Celebration',
  classOf: 'Class of',
  viewDetails: 'The celebration',
  reply: 'Kindly reply',
  newChapter: 'A NEW CHAPTER',
  storyTitle: 'Rooted in dreams.\nReady to bloom.',
  memories: 'A little piece of the journey.',
  storyCopy: 'For every late night, every small victory, and everyone who helped along the way. This moment is ours to celebrate.',
  countdownLabel: 'THE CELEBRATION BEGINS IN',
  countdownTitle: 'Counting the days',
  saveDate: 'SAVE A LITTLE SPACE IN YOUR DIARY',
  detailsTitle: 'A day to remember',
  timeLabel: 'THE TIME',
  placeLabel: 'THE PLACE',
  presence: 'The best part of this milestone is sharing it with you.',
  rsvpLabel: 'A PLACE FOR YOU',
  rsvpTitle: 'Celebrate with us',
  rsvpIntro: 'It wouldn’t be the same without you.',
  guestbook: 'Words for the next chapter',
  closingLabel: 'WITH GRATITUDE & GREAT EXCITEMENT',
  closing: 'Here’s to\nwhat comes next.',
  keepsakeClosing: 'With heartfelt thanks to everyone who shared this day',
};

const ckb: Copy = {
  invited: 'بانگهێشتتان دەکەین بۆ بەشداریکردن لە خۆشیی دەرچوونمان',
  graduation: 'خۆشیی دەرچوون',
  celebration: 'و دەستپێکی چیرۆکێک',
  classOf: 'دەرچووی ساڵی',
  viewDetails: 'زانیارییەکانی ئاهەنگ',
  reply: 'دڵنیاکردنەوەی ئامادەبوون',
  newChapter: 'بەشێکی نوێ لە چیرۆکەکە',
  storyTitle: 'ڕەگێک لە خەونەکان\nو دەستپێکێک کە گوڵ دەکات',
  memories: 'ساتێک لە گەشتێکی لەبیرنەکراو',
  storyCopy: 'بۆ هەموو شەونخوونییەک، بۆ هەموو سەرکەوتنێکی بچووک، و بۆ هەموو ئەوانەی بەشێک بوون لەم گەشتە. خۆشیی ئەم ڕۆژە بە بەشداریتان تەواو دەبێت.',
  countdownLabel: 'تا پێکەوە ئاهەنگ دەگێڕین',
  countdownTitle: 'ڕۆژەکان دەژمێرین بۆ خۆشیمان',
  saveDate: 'ئەم کاتە لەبیر مەکەن',
  detailsTitle: 'ڕۆژێک کە شایەنی ئاهەنگە',
  timeLabel: 'کاتژمێر',
  placeLabel: 'شوێنی ئاهەنگ',
  presence: 'جوانترین شتی ئەم دەستکەوتە ئەوەیە لەگەڵ ئێوەی بەش بکەین.',
  rsvpLabel: 'شوێنتان لەناوماندایە',
  rsvpTitle: 'بەشداری خۆشیمان بن',
  rsvpIntro: 'خۆشیمان بە ئامادەبوونتان تەواو دەبێت.',
  guestbook: 'وشەگەلێک بۆ دەستپێکێکی نوێ',
  closingLabel: 'بە هەموو سوپاس و خۆشییەکەوە',
  closing: 'بۆ خەونی گەورەتر\nو دەستپێکی جوانتر',
  keepsakeClosing: 'لە دڵەوە سوپاس بۆ هەموو ئەوانەی بەشداری خۆشیی دەرچوونمان بوون',
};

const bdn: Copy = {
  invited: 'مە هوین داخواز کرینە بۆ پشکداریێ د شاهیا دەرچوونێ دا',
  graduation: 'شاهیا دەرچوونێ',
  celebration: 'و دەستپێکا چیرۆکەکێ',
  classOf: 'دەرچوویێ ساڵا',
  viewDetails: 'زانیاریێن ئاهەنگێ',
  reply: 'پشتڕاستکرنا ئامادەبوونێ',
  newChapter: 'پشکەکا نوو ژ چیرۆکێ',
  storyTitle: 'ڕەهەک ژ خەونان\nو دەستپێکەک کو گول ددەت',
  memories: 'دەمەک ژ گەشتەکا ژبیرنەبوویی',
  storyCopy: 'بۆ هەمی شەڤبێداریەکێ، بۆ هەمی سەرکەفتنەکا بچووک، و بۆ هەمی ئەوێن پشکەک ژ ڤێ گەشتێ بووین. شاهیا ڤێ ڕۆژێ ب پشکداریا هەوە تەمام دبیت.',
  countdownLabel: 'هەتا پێکڤە ئاهەنگێ دگێڕین',
  countdownTitle: 'ئەم ڕۆژان دهژمێرین بۆ شاهیا خۆ',
  saveDate: 'ڤێ دەمی ژبیر نەکەن',
  detailsTitle: 'ڕۆژەک کو هێژای ئاهەنگێیە',
  timeLabel: 'دەمژمێر',
  placeLabel: 'جهێ ئاهەنگێ',
  presence: 'جوانترین تشتێ ڤێ دەستکەفتێ ئەوە کو دگەل هەوە پارڤە بکەین.',
  rsvpLabel: 'جهێ هەوە د ناڤبەرا مە دایە',
  rsvpTitle: 'پشکداریێ د شاهیا مە دا بکەن',
  rsvpIntro: 'شاهیا مە ب ئامادەبوونا هەوە تەمام دبیت.',
  guestbook: 'پەیڤەک بۆ دەستپێکەکا نوو',
  closingLabel: 'ب هەمی سوپاس و شاهیێ ڤە',
  closing: 'بۆ خەونێن مەزنتر\nو دەستپێکێن جوانتر',
  keepsakeClosing: 'ژ دل سوپاس بۆ هەمی ئەوێن پشکداری د شاهیا دەرچوونێ دا کری',
};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb, bdn };

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

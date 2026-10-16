import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own lines (from the designer's hand-off). Platform strings (buttons, form, countdown units,
 * errors) come from `props.labels`; the customer's content comes from fields. The Kurdish is the owner's
 * approved wording (docs/translations/KURDISH_REVIEW.md, batch 31). Lines added in v2 (the families, the engagement
 * wording) wait for the owner's Kurdish (batch 33) and show the Arabic until then.
 */
const ar = {
  /** Above the names on the closed envelope. */
  wedding: 'بمناسبة زفافنا',
  /** Above the lace card once the envelope is open. */
  cordially: 'ندعوكم لمشاركتنا\nفرحة زفافنا',
  /** Under the envelope once it is open. */
  celebrate: 'ننتظر مشاركتكم\nأجمل أيامنا',
  invitation: 'دعوة زفاف',
  withLove: 'بكل الحب',
  countdownLead: 'موعد فرحتنا يقترب',
  countdownTitle: 'نبدأ حكايتنا',
  detailsLead: 'الزمان والمكان',
  detailsTitle: 'تفاصيل الزفاف',
  timeCaption: 'موعد الاحتفال',
  placeCaption: 'مكان اللقاء',
  /** On the small lace card that leads to the guest form. */
  replyLead: 'بانتظار ردكم',
  replyTitle: 'تأكيد الحضور',
  presence: 'يسعدنا أن تشاركونا فرحتنا',
  keepsakeSubtitle: 'رسائل الأهل والأحبة في يوم زفافنا',
  keepsakeClosing: 'شكرًا لكل من شاركنا فرحتنا',
  /** The families section: a heading and the caption over each family's name. */
  familiesLead: 'بمباركة العائلتين',
  groomFamily: 'عائلة العريس',
  brideFamily: 'عائلة العروس',
} as const;

export type Copy = { [K in keyof typeof ar]: string };

const en: Copy = {
  wedding: 'The wedding of',
  cordially: 'YOU ARE CORDIALLY INVITED\nTO THE WEDDING OF',
  celebrate: 'WE CAN’T WAIT TO CELEBRATE\nWITH YOU!',
  invitation: 'You are invited',
  withLove: 'All of our love',
  countdownLead: 'Countdown to',
  countdownTitle: '“I Do”',
  detailsLead: 'The date & place',
  detailsTitle: 'Details',
  timeCaption: 'The celebration begins',
  placeCaption: 'Join us at',
  replyLead: 'Kindly reply',
  replyTitle: 'Rsvp',
  presence: 'We would love to celebrate with you',
  keepsakeSubtitle: 'Wishes from our family and friends',
  keepsakeClosing: 'Thank you for sharing our joy',
  familiesLead: 'Together with their families',
  groomFamily: 'The groom’s family',
  brideFamily: 'The bride’s family',
};

const ckb: Copy = {
  wedding: 'بە بۆنەی هاوسەرگیریمان',
  cordially: 'بانگهێشتتان دەکەین بۆ بەشداریکردن\nلە خۆشیی هاوسەرگیریمان',
  celebrate: 'چاوەڕێی بەشداریتانین\nلە خۆشترین ڕۆژمان',
  invitation: 'بانگهێشتنامەی هاوسەرگیری',
  withLove: 'بە هەموو خۆشەویستییەوە',
  countdownLead: 'کاتی خۆشیمان نزیک دەبێتەوە',
  countdownTitle: 'چیرۆکەکەمان دەست پێدەکەین',
  detailsLead: 'کات و شوێن',
  detailsTitle: 'زانیارییەکانی هاوسەرگیری',
  timeCaption: 'کاتی ئاهەنگ',
  placeCaption: 'شوێنی دیدار',
  replyLead: 'چاوەڕێی وەڵامتانین',
  replyTitle: 'دڵنیاکردنەوەی ئامادەبوون',
  presence: 'خۆشحاڵ دەبین بەشداری خۆشیمان بکەن',
  keepsakeSubtitle: 'نامەی خێزان و خۆشەویستان لە ڕۆژی هاوسەرگیریماندا',
  keepsakeClosing: 'سوپاس بۆ هەموو ئەوانەی بەشداری خۆشیمان بوون',
  familiesLead: ar.familiesLead,
  groomFamily: ar.groomFamily,
  brideFamily: ar.brideFamily,
};

const bdn: Copy = {
  wedding: 'ب بۆنا داوەتا مە',
  cordially: 'مە هوین داخواز کرینە بۆ پشکداریێ\nد شاهیا داوەتا مە دا',
  celebrate: 'ئەم چاڤەڕێی پشکداریا هەوەینە\nد خۆشترین ڕۆژا مە دا',
  invitation: 'داخوازناما داوەتێ',
  withLove: 'ب هەمی ڤیانێ',
  countdownLead: 'دەمێ شاهیا مە نێزیک دبیت',
  countdownTitle: 'ئەم دەست ب چیرۆکا خۆ دکەین',
  detailsLead: 'دەم و جه',
  detailsTitle: 'زانیاریێن داوەتێ',
  timeCaption: 'دەمێ ئاهەنگێ',
  placeCaption: 'جهێ هەڤدیتنێ',
  replyLead: 'ئەم چاڤەڕێی بەرسڤا هەوەینە',
  replyTitle: 'پشتڕاستکرنا ئامادەبوونێ',
  presence: 'دێ دلخۆش بین ئەگەر هوین پشکداریێ د شاهیا مە دا بکەن',
  keepsakeSubtitle: 'نامێن مالباتێ و هەڤالان د ڕۆژا داوەتا مە دا',
  keepsakeClosing: 'سوپاس بۆ هەمی ئەوێن پشکداری د شاهیا مە دا کری',
  familiesLead: ar.familiesLead,
  groomFamily: ar.groomFamily,
  brideFamily: ar.brideFamily,
};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb, bdn };

/** An engagement (`props.occasion`): every line that names the wedding says engagement instead. */
const arEngagement: Partial<Copy> = {
  wedding: 'بمناسبة خطوبتنا',
  cordially: 'ندعوكم لمشاركتنا\nفرحة خطوبتنا',
  invitation: 'دعوة خطوبة',
  detailsTitle: 'تفاصيل الخطوبة',
  keepsakeSubtitle: 'رسائل الأهل والأحبة في يوم خطوبتنا',
  groomFamily: 'عائلة الخطيب',
  brideFamily: 'عائلة الخطيبة',
};
const ENGAGEMENT: Record<InvitationLocale, Partial<Copy>> = {
  ar: arEngagement,
  en: {
    wedding: 'The engagement of',
    cordially: 'YOU ARE CORDIALLY INVITED\nTO THE ENGAGEMENT OF',
    countdownTitle: 'Our engagement',
    groomFamily: 'The groom-to-be’s family',
    brideFamily: 'The bride-to-be’s family',
  },
  ckb: arEngagement,
  bdn: arEngagement,
};

export function copyFor(locale: InvitationLocale, occasion?: string | null): Copy {
  return occasion === 'engagement' ? { ...COPY[locale], ...ENGAGEMENT[locale] } : COPY[locale];
}

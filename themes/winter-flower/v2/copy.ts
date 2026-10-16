import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own lines (from the designer's hand-off). Platform strings (buttons, form, countdown units,
 * errors) come from `props.labels`; the customer's content comes from fields. The Kurdish is the owner's
 * approved wording (docs/translations/KURDISH_REVIEW.md, batch 31). Lines added in v2 (the families, the engagement
 * wording) wait for the owner's Kurdish (batch 33) and show the Arabic until then.
 */
const ar = {
  saveDate: 'موعد فرحتنا',
  weddingOf: 'بمناسبة زفافنا',
  celebrationOn: 'نحتفل معكم يوم',
  together: 'معاً دائماً',
  ourStory: 'بداية حكايتنا معاً',
  presence: 'تكتمل فرحتنا بحضوركم ومشاركتكم أجمل أيامنا.',
  countdownLead: 'حتى نبدأ حكايتنا',
  countdownTitle: 'ننتظر يوم فرحتنا',
  detailsLead: 'موعد ننتظره معكم',
  detailsTitle: 'تفاصيل الزفاف',
  at: 'الساعة',
  withFamilies: 'بمشاركة أهلنا وأحبتنا',
  venueLabel: 'مكان الاحتفال',
  replyLead: 'ننتظر رسالتكم',
  replyTitle: 'ننتظر ردكم',
  replyIntro: 'حجزنا لكم مكاناً في فرحتنا.',
  withLove: 'بكل الحب',
  closing: 'بداية حكايتنا معاً',
  keepsakeClosing: 'شكراً من القلب لكل من شاركنا فرحتنا',
  /** The families section: a heading and the caption over each family's name. */
  familiesLead: 'بمباركة العائلتين',
  groomFamily: 'عائلة العريس',
  brideFamily: 'عائلة العروس',
} as const;

export type Copy = { [K in keyof typeof ar]: string };

const en: Copy = {
  saveDate: 'SAVE THE DATE',
  weddingOf: 'FOR THE WEDDING OF',
  celebrationOn: 'A CELEBRATION ON',
  together: 'TOGETHER, ALWAYS',
  ourStory: 'Our next chapter',
  presence: 'Your presence will make our day complete.',
  countdownLead: 'UNTIL OUR NEXT CHAPTER',
  countdownTitle: 'Counting the days',
  detailsLead: 'A NOTE FOR YOUR DIARY',
  detailsTitle: 'The details',
  at: 'AT',
  withFamilies: 'TOGETHER WITH OUR FAMILIES',
  venueLabel: 'THE CELEBRATION',
  replyLead: 'A LETTER BACK TO US',
  replyTitle: 'Kindly reply',
  replyIntro: 'We have saved a place for you.',
  withLove: 'WITH LOVE',
  closing: 'A beautiful beginning',
  keepsakeClosing: 'With heartfelt thanks to everyone who shared our joy',
  familiesLead: 'TOGETHER WITH THEIR FAMILIES',
  groomFamily: 'THE GROOM’S FAMILY',
  brideFamily: 'THE BRIDE’S FAMILY',
};

const ckb: Copy = {
  saveDate: 'کاتی خۆشیمان',
  weddingOf: 'بە بۆنەی هاوسەرگیریمان',
  celebrationOn: 'لەگەڵتان ئاهەنگ دەگێڕین لە ڕۆژی',
  together: 'هەمیشە پێکەوە',
  ourStory: 'دەستپێکی چیرۆکی پێکەوەمان',
  presence: 'خۆشیمان بە ئامادەبوون و بەشداریتان لە خۆشترین ڕۆژمان تەواو دەبێت.',
  countdownLead: 'تا چیرۆکەکەمان دەست پێدەکەین',
  countdownTitle: 'چاوەڕێی ڕۆژی خۆشیمانین',
  detailsLead: 'کاتێک کە لەگەڵتان چاوەڕێی دەکەین',
  detailsTitle: 'زانیارییەکانی هاوسەرگیری',
  at: 'کاتژمێر',
  withFamilies: 'بە بەشداریی خێزان و خۆشەویستانمان',
  venueLabel: 'شوێنی ئاهەنگ',
  replyLead: 'چاوەڕێی نامەکەتانین',
  replyTitle: 'چاوەڕێی وەڵامتانین',
  replyIntro: 'شوێنێکمان بۆ ئێوە لە خۆشیماندا گرتووە.',
  withLove: 'بە هەموو خۆشەویستییەوە',
  closing: 'دەستپێکی چیرۆکی پێکەوەمان',
  keepsakeClosing: 'لە دڵەوە سوپاس بۆ هەموو ئەوانەی بەشداری خۆشیمان بوون',
  familiesLead: ar.familiesLead,
  groomFamily: ar.groomFamily,
  brideFamily: ar.brideFamily,
};

const bdn: Copy = {
  saveDate: 'دەمێ شاهیا مە',
  weddingOf: 'ب بۆنا داوەتا مە',
  celebrationOn: 'ئەم دێ دگەل هەوە ئاهەنگێ گێڕین ل ڕۆژا',
  together: 'هەردەم پێکڤە',
  ourStory: 'دەستپێکا چیرۆکا مە یا پێکڤە',
  presence: 'شاهیا مە ب ئامادەبوون و پشکداریا هەوە د خۆشترین ڕۆژا مە دا تەمام دبیت.',
  countdownLead: 'هەتا ئەم دەست ب چیرۆکا خۆ دکەین',
  countdownTitle: 'ئەم چاڤەڕێی ڕۆژا شاهیا خۆینە',
  detailsLead: 'دەمەکێ ئەم دگەل هەوە چاڤەڕێ دکەین',
  detailsTitle: 'زانیاریێن داوەتێ',
  at: 'دەمژمێر',
  withFamilies: 'ب پشکداریا مالبات و هەڤالێن مە',
  venueLabel: 'جهێ ئاهەنگێ',
  replyLead: 'ئەم چاڤەڕێی نامەیا هەوەینە',
  replyTitle: 'ئەم چاڤەڕێی بەرسڤا هەوەینە',
  replyIntro: 'مە جهەک بۆ هەوە د شاهیا خۆ دا گرتییە.',
  withLove: 'ب هەمی ڤیانێ',
  closing: 'دەستپێکا چیرۆکا مە یا پێکڤە',
  keepsakeClosing: 'ژ دل سوپاس بۆ هەمی ئەوێن پشکداری د شاهیا مە دا کری',
  familiesLead: ar.familiesLead,
  groomFamily: ar.groomFamily,
  brideFamily: ar.brideFamily,
};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb, bdn };

/** An engagement (`props.occasion`): every line that names the wedding says engagement instead. */
const arEngagement: Partial<Copy> = {
  weddingOf: 'بمناسبة خطوبتنا',
  detailsTitle: 'تفاصيل الخطوبة',
  groomFamily: 'عائلة الخطيب',
  brideFamily: 'عائلة الخطيبة',
};
const ENGAGEMENT: Record<InvitationLocale, Partial<Copy>> = {
  ar: arEngagement,
  en: {
    weddingOf: 'FOR THE ENGAGEMENT OF',
    groomFamily: 'THE GROOM-TO-BE’S FAMILY',
    brideFamily: 'THE BRIDE-TO-BE’S FAMILY',
  },
  ckb: arEngagement,
  bdn: arEngagement,
};

export function copyFor(locale: InvitationLocale, occasion?: string | null): Copy {
  return occasion === 'engagement' ? { ...COPY[locale], ...ENGAGEMENT[locale] } : COPY[locale];
}

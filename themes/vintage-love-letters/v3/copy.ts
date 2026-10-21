import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own lines (from the designer's hand-off). Platform strings (buttons, form, countdown units,
 * errors) come from `props.labels`; the customer's content comes from fields. The Kurdish is the owner's
 * approved wording (docs/translations/KURDISH_REVIEW.md, batch 31; the lines added in v2, the families and the
 * engagement wording, batch 33).
 */
const ar = {
  /** Under the "Open invitation" button on the closed poster. */
  sealed: 'رسالة صغيرة لبداية جميلة',
  /** On the letter that rises from the envelope. */
  letterLove: 'بكل الحب',
  letterInvite: 'تبدأ حكايتنا بحضوركم.',
  /** The poster title on Arabic-script invitations (English ones show the poster's own lettering). */
  wedding: 'دعوة',
  invitation: 'زفاف',
  join: 'بمشاركة أهلنا وأحبتنا',
  saveDate: 'موعد فرحتنا',
  dear: 'إلى أهلنا وأحبتنا،',
  countdownLead: 'حتى نبدأ حكايتنا',
  countdownTitle: 'ننتظر يوم فرحتنا',
  detailsLead: 'موعد ننتظره معكم',
  detailsTitle: 'تفاصيل الزفاف',
  at: 'الساعة',
  venueLabel: 'مكان الاحتفال',
  presence: 'تكتمل فرحتنا بحضوركم ومشاركتكم أجمل أيامنا.',
  replyLead: 'ننتظر رسالتكم',
  replyTitle: 'ننتظر ردكم',
  replyIntro: 'حجزنا لكم مكاناً في فرحتنا.',
  closing: 'بداية حكايتنا معاً',
  keepsakeClosing: 'شكراً من القلب لكل من شاركنا فرحتنا',
  /** The families section: a heading and the caption over each family's name. */
  familiesLead: 'بمباركة العائلتين',
  groomFamily: 'عائلة العريس',
  brideFamily: 'عائلة العروس',
} as const;

export type Copy = { [K in keyof typeof ar]: string };

const en: Copy = {
  sealed: 'A little letter. A beautiful beginning.',
  letterLove: 'WITH LOVE',
  letterInvite: 'Our next chapter begins with you.',
  wedding: 'WEDDING',
  invitation: 'Invitation',
  join: 'TOGETHER WITH OUR FAMILIES',
  saveDate: 'SAVE THE DATE',
  dear: 'To our dearest family & friends,',
  countdownLead: 'UNTIL OUR NEXT CHAPTER',
  countdownTitle: 'Counting the days',
  detailsLead: 'A NOTE FOR YOUR DIARY',
  detailsTitle: 'The details',
  at: 'AT',
  venueLabel: 'THE CELEBRATION',
  presence: 'Your presence will make our day complete.',
  replyLead: 'A LETTER BACK TO US',
  replyTitle: 'A little reply',
  replyIntro: 'We have saved a place for you.',
  closing: 'The beginning of our forever.',
  keepsakeClosing: 'With heartfelt thanks to everyone who shared our joy',
  familiesLead: 'TOGETHER WITH THEIR FAMILIES',
  groomFamily: 'THE GROOM’S FAMILY',
  brideFamily: 'THE BRIDE’S FAMILY',
};

const ckb: Copy = {
  sealed: 'نامەیەکی بچووک بۆ دەستپێکێکی جوان',
  letterLove: 'بە هەموو خۆشەویستییەوە',
  letterInvite: 'چیرۆکەکەمان بە ئامادەبوونتان دەست پێدەکات.',
  wedding: 'بانگهێشتنامە',
  invitation: 'هاوسەرگیری',
  join: 'بە بەشداریی خێزان و خۆشەویستانمان',
  saveDate: 'کاتی خۆشیمان',
  dear: 'بۆ خێزان و خۆشەویستانمان،',
  countdownLead: 'تا چیرۆکەکەمان دەست پێدەکەین',
  countdownTitle: 'چاوەڕێی ڕۆژی خۆشیمانین',
  detailsLead: 'کاتێک کە لەگەڵتان چاوەڕێی دەکەین',
  detailsTitle: 'زانیارییەکانی هاوسەرگیری',
  at: 'کاتژمێر',
  venueLabel: 'شوێنی ئاهەنگ',
  presence: 'خۆشیمان بە ئامادەبوون و بەشداریتان لە خۆشترین ڕۆژمان تەواو دەبێت.',
  replyLead: 'چاوەڕێی نامەکەتانین',
  replyTitle: 'چاوەڕێی وەڵامتانین',
  replyIntro: 'شوێنێکمان بۆ ئێوە لە خۆشیماندا گرتووە.',
  closing: 'دەستپێکی چیرۆکی پێکەوەمان',
  keepsakeClosing: 'لە دڵەوە سوپاس بۆ هەموو ئەوانەی بەشداری خۆشیمان بوون',
  familiesLead: 'بە بەرەکەتی هەردوو بنەماڵە',
  groomFamily: 'بنەماڵەی زاوا',
  brideFamily: 'بنەماڵەی بووک',
};

const bdn: Copy = {
  sealed: 'نامەیەکا بچووک بۆ دەستپێکەکا جوان',
  letterLove: 'ب هەمی ڤیانێ',
  letterInvite: 'چیرۆکا مە ب ئامادەبوونا هەوە دەست پێدکەت.',
  wedding: 'داخوازنامە',
  invitation: 'داوەت',
  join: 'ب پشکداریا مالبات و هەڤالێن مە',
  saveDate: 'دەمێ شاهیا مە',
  dear: 'بۆ مالبات و هەڤالێن مە،',
  countdownLead: 'هەتا ئەم دەست ب چیرۆکا خۆ دکەین',
  countdownTitle: 'ئەم چاڤەڕێی ڕۆژا شاهیا خۆینە',
  detailsLead: 'دەمەکێ ئەم دگەل هەوە چاڤەڕێ دکەین',
  detailsTitle: 'زانیاریێن داوەتێ',
  at: 'دەمژمێر',
  venueLabel: 'جهێ ئاهەنگێ',
  presence: 'شاهیا مە ب ئامادەبوون و پشکداریا هەوە د خۆشترین ڕۆژا مە دا تەمام دبیت.',
  replyLead: 'ئەم چاڤەڕێی نامەیا هەوەینە',
  replyTitle: 'ئەم چاڤەڕێی بەرسڤا هەوەینە',
  replyIntro: 'مە جهەک بۆ هەوە د شاهیا خۆ دا گرتییە.',
  closing: 'دەستپێکا چیرۆکا مە یا پێکڤە',
  keepsakeClosing: 'ژ دل سوپاس بۆ هەمی ئەوێن پشکداری د شاهیا مە دا کری',
  familiesLead: 'ب بەرەکەتا هەردوو مالباتان',
  groomFamily: 'مالباتا زاڤای',
  brideFamily: 'مالباتا بویکێ',
};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb, bdn };

/** An engagement (`props.occasion`): every line that names the wedding says engagement instead. */
const arEngagement: Partial<Copy> = {
  invitation: 'خطوبة',
  detailsTitle: 'تفاصيل الخطوبة',
  groomFamily: 'عائلة الخطيب',
  brideFamily: 'عائلة الخطيبة',
};
const ENGAGEMENT: Record<InvitationLocale, Partial<Copy>> = {
  ar: arEngagement,
  en: {
    wedding: 'ENGAGEMENT',
    groomFamily: 'THE GROOM-TO-BE’S FAMILY',
    brideFamily: 'THE BRIDE-TO-BE’S FAMILY',
  },
  ckb: {
    invitation: 'دەستگیرانی',
    detailsTitle: 'زانیارییەکانی دەستگیرانی',
    groomFamily: 'بنەماڵەی دەستگیرانی کوڕ',
    brideFamily: 'بنەماڵەی دەستگیرانی کچ',
  },
  bdn: {
    invitation: 'دەزگرانی',
    detailsTitle: 'زانیاریێن دەزگرانیێ',
    groomFamily: 'مالباتا دەزگرانێ کوڕ',
    brideFamily: 'مالباتا دەزگرانا کچ',
  },
};

/**
 * The poster's own lettering reads «WEDDING Invitation» in every language; for an engagement this word is lettered
 * over its top band instead (null: the poster as it is).
 */
export function posterBand(occasion: string | null | undefined): string | null {
  return occasion === 'engagement' ? 'ENGAGEMENT' : null;
}

export function copyFor(locale: InvitationLocale, occasion?: string | null): Copy {
  return occasion === 'engagement' ? { ...COPY[locale], ...ENGAGEMENT[locale] } : COPY[locale];
}

import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own lines (from the designer's hand-off, docs/themes/laurel-bloom/). Platform strings (buttons, form,
 * countdown units, errors) come from `props.labels`; the customer's content comes from fields. Kurdish waits for the
 * owner's approval (docs/translations/KURDISH_REVIEW.md, batch 34) and shows the Arabic until then.
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

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb: ar, bdn: ar };

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

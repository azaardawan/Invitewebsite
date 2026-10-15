import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own lines (from the designer's hand-off). Platform strings (buttons, form, countdown units,
 * errors) come from `props.labels`; the customer's content comes from fields. Kurdish invitations show the
 * Arabic until the owner approves the suggestions in docs/translations/KURDISH_REVIEW.md (batch 31; the same lines as Burgundy & Lace).
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
};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb: ar, bdn: ar };

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

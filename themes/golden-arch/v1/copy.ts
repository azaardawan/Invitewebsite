import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own lines. Platform strings (buttons, form, countdown units, errors) come from `props.labels`; the
 * customer's content comes from fields, and the poster's script line ("Reception to follow!") is the changeable
 * `followLine` (manifest wording). Kurdish waits for the owner's approval (docs/translations/KURDISH_REVIEW.md,
 * batch 34) and shows the Arabic until then.
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

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb: ar, bdn: ar };

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

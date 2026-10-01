import type { InvitationLocale } from '@/theme-sdk';

/**
 * The theme's own decorative wording. Every platform string (buttons, form,
 * countdown units, errors) comes from `props.labels`; customer content comes
 * from fields. Kurdish (ckb/bdn) shows Arabic until the owner approves
 * translations (docs/translations/KURDISH_REVIEW.md).
 */
const ar = {
  openHint: 'اضغط لفتح علبة الدعوة',
  basmala: 'بسم الله الرحمن الرحيم',
  and: 'و',
  countdownTitle: 'يبدأ الحفل بعد',
  formIntro: 'يسعدنا أن نعرف إن كنت ستشاركنا فرحتنا.',
  closing: 'شكرًا لمشاركتكم فرحتنا',
  closingSub: 'حضوركم يتمّ سعادتنا',
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
};

export function copyFor(locale: InvitationLocale): Copy {
  return locale === 'en' ? en : ar;
}

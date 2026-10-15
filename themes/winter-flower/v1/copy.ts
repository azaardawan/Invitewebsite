import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own lines (from the designer's hand-off). Platform strings (buttons, form, countdown units,
 * errors) come from `props.labels`; the customer's content comes from fields. Kurdish invitations show the
 * Arabic until the owner approves the suggestions in docs/translations/KURDISH_REVIEW.md (batch 31).
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
};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb: ar, bdn: ar };

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

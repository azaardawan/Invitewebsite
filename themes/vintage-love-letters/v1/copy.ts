import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own lines (from the designer's hand-off). Platform strings (buttons, form, countdown units,
 * errors) come from `props.labels`; the customer's content comes from fields. Kurdish invitations show the
 * Arabic until the owner approves the suggestions in docs/translations/KURDISH_REVIEW.md (batch 31).
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
};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb: ar, bdn: ar };

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

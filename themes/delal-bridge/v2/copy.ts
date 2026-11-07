import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own lines. Platform strings (buttons, form, countdown units, map, guest messages) come from
 * `props.labels`; the couple's details come from fields. Wedding and engagement wording is chosen from `props.occasion`.
 * The verse and its reference always stay in Arabic; English invitations add a translation under it.
 * Kurdish: docs/translations/KURDISH_REVIEW.md, batch 49 (auto-approved, the owner checks it in Admin → Translations).
 */
const ar = {
  /** Over the names on the cover. */
  heroWedding: 'يحتفلان بزفافهما',
  heroEngagement: 'يحتفلان بخطوبتهما',
  /** On the card in the gateway. */
  blessing: 'بمباركة الأهل والأحبة',
  cardWedding: 'يتشرّفان بدعوتكم لحضور حفل زفافهما',
  cardEngagement: 'يتشرّفان بدعوتكم لحضور حفل خطوبتهما',
  /** Ar-Rum 30:21. Never changed by customers. */
  verseLead: 'بسم الله الرحمن الرحيم',
  verse: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
  verseRef: 'سورة الروم، الآية ٢١',
  /** Shown under the verse in English invitations only. */
  verseTranslation: '',
  eventLead: 'الاحتفال',
  eventTitle: 'شاركونا هذه الفرحة',
  eventWedding: 'ليلة الزفاف',
  eventEngagement: 'حفل الخطوبة',
  countdownLead: 'نعدّ الأيام',
  countdownTitle: 'حتى اليوم الموعود',
  replyLead: 'نرجو الرد',
  replyTitle: 'هل ستشاركوننا؟',
  guestbookLead: 'بكل الحب',
  closingLead: 'بكل الحب والامتنان',
  closing: 'شكراً لأنكم جزء من قصتنا، حضوركم أجمل هدية',
  keepsakeClosing: 'شكراً من القلب لكل من شاركنا فرحتنا',
} as const;

export type Copy = { [K in keyof typeof ar]: string };

const en: Copy = {
  heroWedding: 'ARE GETTING MARRIED',
  heroEngagement: 'ARE GETTING ENGAGED',
  blessing: 'Together with their families',
  cardWedding: 'invite you to celebrate their wedding',
  cardEngagement: 'invite you to celebrate their engagement',
  verseLead: 'In the name of God',
  verse: ar.verse,
  verseRef: 'Surah Ar-Rum, 30:21',
  verseTranslation:
    'And among His signs is that He created for you spouses from among yourselves, that you may find tranquillity in them; and He placed between you affection and mercy.',
  eventLead: 'THE CELEBRATION',
  eventTitle: 'Join us in this Celebration',
  eventWedding: 'Wedding Night',
  eventEngagement: 'Engagement',
  countdownLead: 'COUNTING THE DAYS',
  countdownTitle: 'Until the big day',
  replyLead: 'KINDLY REPLY',
  replyTitle: 'Will you join us?',
  guestbookLead: 'WITH LOVE',
  closingLead: 'WITH LOVE AND GRATITUDE',
  closing: 'Thank you for being part of our story. Your presence is the most beautiful gift.',
  keepsakeClosing: 'With heartfelt thanks to everyone who shared our joy',
};

const ckb: Copy = {
  heroWedding: 'ئاهەنگی هاوسەرگیرییان دەگێڕن',
  heroEngagement: 'ئاهەنگی دەستگیرانییان دەگێڕن',
  blessing: 'بە پیرۆزبایی خێزان و خۆشەویستان',
  cardWedding: 'شانازی دەکەن بە بانگهێشتکردنتان بۆ ئاهەنگی هاوسەرگیرییان',
  cardEngagement: 'شانازی دەکەن بە بانگهێشتکردنتان بۆ ئاهەنگی دەستگیرانییان',
  verseLead: ar.verseLead,
  verse: ar.verse,
  verseRef: ar.verseRef,
  verseTranslation: '',
  eventLead: 'ئاهەنگ',
  eventTitle: 'بەشداری ئەم خۆشییەمان بکەن',
  eventWedding: 'شەوی هاوسەرگیری',
  eventEngagement: 'ئاهەنگی دەستگیرانی',
  countdownLead: 'ڕۆژەکان دەژمێرین',
  countdownTitle: 'تا ڕۆژە چاوەڕوانکراوەکە',
  replyLead: 'تکایە وەڵام بدەنەوە',
  replyTitle: 'بەشداریمان دەکەن؟',
  guestbookLead: 'بە هەموو خۆشەویستییەوە',
  closingLead: 'بە خۆشەویستی و سوپاسەوە',
  closing: 'سوپاس کە بەشێکن لە چیرۆکەکەمان، ئامادەبوونتان جوانترین دیارییە',
  keepsakeClosing: 'لە دڵەوە سوپاس بۆ هەموو ئەوانەی بەشداری خۆشیمان بوون',
};

const bdn: Copy = {
  heroWedding: 'ئاهەنگا داوەتا خۆ دگێڕن',
  heroEngagement: 'ئاهەنگا دەستگیرانیا خۆ دگێڕن',
  blessing: 'ب پیرۆزباهیا مالباتێ و خۆشتڤیان',
  cardWedding: 'ب شانازی هەوە داخواز دکەن بۆ ئاهەنگا داوەتا خۆ',
  cardEngagement: 'ب شانازی هەوە داخواز دکەن بۆ ئاهەنگا دەستگیرانیا خۆ',
  verseLead: ar.verseLead,
  verse: ar.verse,
  verseRef: ar.verseRef,
  verseTranslation: '',
  eventLead: 'ئاهەنگ',
  eventTitle: 'پشکداریێ د ڤێ شاهیێ دا بکەن',
  eventWedding: 'شەڤا داوەتێ',
  eventEngagement: 'ئاهەنگا دەستگیرانیێ',
  countdownLead: 'ئەم ڕۆژان دهژمێرین',
  countdownTitle: 'هەتا ڕۆژا چاڤەڕێکری',
  replyLead: 'هیڤیە بەرسڤێ بدەن',
  replyTitle: 'دێ پشکداریا مە کەن؟',
  guestbookLead: 'ب هەمی حەژێکرنێ',
  closingLead: 'ب حەژێکرن و سوپاسیێ',
  closing: 'سوپاس کو هوین پشکەک ژ چیرۆکا مەنە، ئامادەبوونا هەوە جوانترین دیاریە',
  keepsakeClosing: 'ژ دل سوپاس بۆ هەمی ئەوێن پشکداری د شاهیا مە دا کری',
};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb, bdn };

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

/** Wedding wording unless the invitation is for an engagement. */
export function byOccasion(occasion: string | null, wedding: string, engagement: string): string {
  return occasion === 'engagement' ? engagement : wedding;
}

/** "Name and Name" with the invitation's own word between them. */
export function coupleNames(a: string | undefined, b: string | undefined, and: string): string {
  return [a?.trim(), b?.trim()].filter(Boolean).join(` ${and} `);
}

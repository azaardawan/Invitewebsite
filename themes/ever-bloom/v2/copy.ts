import type { InvitationLocale } from '@/theme-sdk';

/**
 * Ever Bloom's fixed lines (the designer's English and Arabic; Sorani and Badini written for it, auto-approved in
 * docs/translations/KURDISH_REVIEW.md). The lines the customer rewrites in place are the manifest's `wording`.
 */
const en = {
  giftFor: 'For you,',
  hint: 'a little surprise, just because',
  tap: 'Tap to open',
  eyebrow: 'A little gift of love',
  continue: 'A little further',
  memories: 'Our little world',
  letterLabel: 'Something I wanted to say',
  replay: 'Replay the flowers',
  addPhoto: 'Add a photo',
  namePlaceholder: 'Name',
  letterPlaceholder: 'Write your letter here…',
};

export type Copy = typeof en;

export const COPY: Record<InvitationLocale, Copy> = {
  en,
  ar: {
    giftFor: 'لك،',
    hint: 'مفاجأة صغيرة، لأنك تستحق',
    tap: 'اضغط لفتح الهدية',
    eyebrow: 'هدية صغيرة من القلب',
    continue: 'المزيد من الحب',
    memories: 'عالمنا الصغير',
    letterLabel: 'كلمات من القلب',
    replay: 'أعد عرض الزهور',
    addPhoto: 'أضف صورة',
    namePlaceholder: 'الاسم',
    letterPlaceholder: 'اكتب رسالتك هنا…',
  },
  ckb: {
    giftFor: 'بۆ تۆ،',
    hint: 'سوپرایزێکی بچووک، تەنها لەبەر ئەوەی شایەنی',
    tap: 'دەست بنێ بۆ کردنەوەی دیارییەکە',
    eyebrow: 'دیارییەکی بچووک لە دڵەوە',
    continue: 'خۆشەویستیی زیاتر',
    memories: 'جیهانە بچووکەکەمان',
    letterLabel: 'وشەگەلێک لە دڵەوە',
    replay: 'گوڵەکان دووبارە ببینەوە',
    addPhoto: 'وێنەیەک زیاد بکە',
    namePlaceholder: 'ناو',
    letterPlaceholder: 'نامەکەت لێرە بنووسە…',
  },
  bdn: {
    giftFor: 'بۆ تە،',
    hint: 'سوپرایزەکا بچووک، چونکی تو هێژایی',
    tap: 'دەستێ بدە بۆ ڤەکرنا دیاریێ',
    eyebrow: 'دیاریەکا بچووک ژ دلی',
    continue: 'ڤیانا پتر',
    memories: 'جیهانا مە یا بچووک',
    letterLabel: 'پەیڤێن ژ دلی',
    replay: 'گولان جارەکا دی ببینە',
    addPhoto: 'وێنەیەکی زێدە بکە',
    namePlaceholder: 'ناڤ',
    letterPlaceholder: 'نامەیا خۆ ل ڤێرێ بنڤیسە…',
  },
};

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

/** The lines the customer may rewrite in place (manifest `wording`): the Arabic default and each language's own. */
const line = (
  key: string,
  label: { ar: string; en: string; ckb: string; bdn: string },
  ar: string,
  en: string,
  ckb: string,
  bdn: string,
  maxLength: number,
) => ({
  key,
  label,
  ar,
  versions: { en, ckb, bdn },
  defaultIn: ['en', 'ckb', 'bdn'] as ('en' | 'ckb' | 'bdn')[],
  maxLength,
});

export const WORDING = [
  line('title', { ar: 'العنوان', en: 'The title', ckb: 'ناونیشان', bdn: 'ناڤونیشان' }, 'منّي إليك.', 'From me to you.', 'لە منەوە بۆ تۆ.', 'ژ من بۆ تە.', 32),
  line(
    'intro',
    {
      ar: 'السطر تحت العنوان',
      en: 'The line under the title',
      ckb: 'دێڕی ژێر ناونیشان',
      bdn: 'رێزا ژێر ناڤونیشانی',
    },
    'لكل اللحظات الصغيرة التي تصنع حكايتنا.',
    'For all the little moments that make us, us.',
    'بۆ هەموو ئەو ساتە بچووکانەی چیرۆکەکەمان دروست دەکەن.',
    'بۆ هەمی ئەو دەمێن بچووک یێن چیرۆکا مە چێدکەن.',
    80,
  ),
  line(
    'memoryTitle',
    {
      ar: 'عنوان الصور',
      en: 'The photos’ title',
      ckb: 'ناونیشانی وێنەکان',
      bdn: 'ناڤونیشانێ وێنەیان',
    },
    'نحن، في لحظات.',
    'Us, in moments.',
    'ئێمە، لە ساتەکاندا.',
    'ئەم، د دەمان دا.',
    32,
  ),
  line(
    'memoryIntro',
    {
      ar: 'السطر تحت عنوان الصور',
      en: 'The line under the photos’ title',
      ckb: 'دێڕی ژێر ناونیشانی وێنەکان',
      bdn: 'رێزا ژێر ناڤونیشانێ وێنەیان',
    },
    'أيام أتمنى لو تبقى إلى الأبد.',
    'The days I wish I could keep forever.',
    'ئەو ڕۆژانەی خۆزگە بۆ هەمیشە بمانایەتەوە.',
    'ئەو ڕۆژێن من دڤێت هەروهەر بمینن.',
    80,
  ),
  line(
    'salutation',
    {
      ar: 'بداية الرسالة',
      en: 'The letter’s greeting',
      ckb: 'سڵاوی نامەکە',
      bdn: 'سلاڤا نامێ',
    },
    'حبيبي،',
    'My love,',
    'خۆشەویستەکەم،',
    'خۆشتڤیێ من،',
    40,
  ),
  line(
    'signoff',
    {
      ar: 'ختام الرسالة',
      en: 'The letter’s closing',
      ckb: 'کۆتاییی نامەکە',
      bdn: 'دوماهیا نامێ',
    },
    'لك دائماً،',
    'Always yours,',
    'هەمیشە هی تۆم،',
    'هەردەم یێ تە مە،',
    40,
  ),
  line(
    'footer',
    {
      ar: 'السطر الأخير',
      en: 'The last line',
      ckb: 'دوایین دێڕ',
      bdn: 'دوماهیک رێز',
    },
    'سأختارك دائماً.',
    'I’ll always choose you.',
    'هەمیشە تۆ هەڵدەبژێرم.',
    'ئەز هەردەم دێ تە هەلبژێرم.',
    40,
  ),
  line(
    'footerSub',
    {
      ar: 'تحت السطر الأخير',
      en: 'Under the last line',
      ckb: 'ژێر دوایین دێڕ',
      bdn: 'ژێر دوماهیک رێزێ',
    },
    'في أبسط الأشياء، وفي كل شيء.',
    'In the little things. In everything.',
    'لە بچووکترین شتەکاندا، لە هەموو شتێکدا.',
    'د بچووکترین تشتان دا، د هەمی تشتان دا.',
    60,
  ),
];

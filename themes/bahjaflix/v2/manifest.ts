import { defineTheme } from '@/theme-sdk/manifest';

/**
 * BAHJAFLIX (Couples): the couple's own page, made like a streaming app's title page (owner, 2026-10-31). Not an
 * invitation: no date, venue or replies. At the top their one video plays (feature `video`), with the BAHJAFLIX logo,
 * the title they gave it, "starring" with their names and their story; under it up to six rows of six photos (tall and
 * wide in turn), each opening on its own with its title and few words. v2 (owner, 2026-11-01): six rows, each a set of
 * six (packages sell 1, 3 or 6 sets…); a row the customer leaves empty, or a set the package doesn't sell, isn't shown. On a computer: a side rail, a split hero and
 * rows that page with arrows and grow on hover; on a phone: a big video card, rows to swipe and a bottom bar.
 * A template design: the customer fills it in place (`editor: 'template'`), so every text is an `<EditableText>`.
 */
const allFields = ['person_1_name', 'person_2_name', 'invitation_message'] as const;

const TALL = 2 / 3;
const WIDE = 1.6;

export default defineTheme({
  key: 'bahjaflix',
  version: 2,
  title: { ar: 'بهجة فليكس', en: 'BAHJAFLIX', ckb: 'بەهجەفلیکس', bdn: 'بەهجەفلیکس' },
  experience: 'INVITATION',
  sections: ['couples'],
  fields: [...allFields],
  features: ['photos', 'video', 'couple_poster'],
  editor: 'template',
  // Example packages; the owner builds the real ones in Admin (and how many photos each one sells).
  validStates: [
    { features: ['photos', 'video'], fields: [...allFields] },
    { features: ['photos', 'video', 'couple_poster'], fields: [...allFields] },
  ],
  // The title page's own lines, all written by the customer in place (the Arabic is the example).
  wording: [
    {
      key: 'title',
      label: { ar: 'عنوان فيلمكما', en: 'Your film’s title', ckb: 'ناونیشانی فیلمەکەتان', bdn: 'ناڤونیشانێ فیلما هەوە' },
      ar: 'معاً إلى الأبد',
      versions: { en: 'Together Forever', ckb: 'پێکەوە بۆ هەمیشە', bdn: 'پێکڤە بۆ هەروهەر' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 28,
    },
    {
      key: 'label',
      label: { ar: 'الكلمة بجانب شعار B', en: 'The word next to the B', ckb: 'وشەی تەنیشت B', bdn: 'پەیڤا تەنشت B' },
      ar: 'ذكريات',
      versions: { en: 'MEMORIES', ckb: 'یادەوەری', bdn: 'بیرهاتن' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 16,
    },
    {
      key: 'badge',
      label: { ar: 'السطر بجانب TOP #01', en: 'The line next to TOP #01', ckb: 'دێڕی تەنیشت TOP #01', bdn: 'رێزا تەنشت TOP #01' },
      ar: 'رقم 1 في قلبي',
      versions: { en: 'No. 1 in my heart', ckb: 'یەکەم لە دڵمدا', bdn: 'ئێکەم د دلێ مندا' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 28,
    },
    {
      key: 'since',
      label: { ar: 'سطر التاريخ', en: 'The date line', ckb: 'دێڕی بەروار', bdn: 'رێزا رێکەفتێ' },
      ar: 'منذ 14 شباط 2019',
      versions: { en: 'Since 14 February 2019', ckb: 'لە ١٤ی شوباتی ٢٠١٩ەوە', bdn: 'ژ ١٤ی شوباتا ٢٠١٩ێ' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 32,
    },
    {
      key: 'tag',
      label: { ar: 'المناسبة', en: 'The occasion', ckb: 'بۆنە', bdn: 'بۆنە' },
      ar: 'ذكرى زواجنا',
      versions: { en: 'Our anniversary', ckb: 'یادی هاوسەرگیریمان', bdn: 'بیرهاتنا زەواجا مە' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 24,
    },
    {
      key: 'row1',
      label: { ar: 'عنوان الصف الأول', en: 'First row title', ckb: 'ناونیشانی ڕیزی یەکەم', bdn: 'ناڤونیشانێ رێزا ئێکێ' },
      ar: 'أجمل ذكرياتنا',
      versions: { en: 'Our best memories', ckb: 'جوانترین یادەوەرییەکانمان', bdn: 'جوانترین بیرهاتنێن مە' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 28,
    },
    {
      key: 'row2',
      label: { ar: 'عنوان الصف الثاني', en: 'Second row title', ckb: 'ناونیشانی ڕیزی دووەم', bdn: 'ناڤونیشانێ رێزا دووێ' },
      ar: 'لحظاتنا',
      versions: { en: 'Our moments', ckb: 'ساتەکانمان', bdn: 'دەمێن مە' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 28,
    },
    {
      key: 'row3',
      label: { ar: 'عنوان الصف الثالث', en: 'Third row title', ckb: 'ناونیشانی ڕیزی سێیەم', bdn: 'ناڤونیشانێ رێزا سێیێ' },
      ar: 'نحن',
      versions: { en: 'Us', ckb: 'ئێمە', bdn: 'ئەم' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 28,
    },
    {
      key: 'row4',
      label: { ar: 'عنوان الصف الرابع', en: 'Fourth row title', ckb: 'ناونیشانی ڕیزی چوارەم', bdn: 'ناڤونیشانێ رێزا چارێ' },
      ar: 'سفراتنا',
      versions: { en: 'Our trips', ckb: 'گەشتەکانمان', bdn: 'گەشتێن مە' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 28,
    },
    {
      key: 'row5',
      label: { ar: 'عنوان الصف الخامس', en: 'Fifth row title', ckb: 'ناونیشانی ڕیزی پێنجەم', bdn: 'ناڤونیشانێ رێزا پێنجێ' },
      ar: 'ضحكاتنا',
      versions: { en: 'Our laughs', ckb: 'پێکەنینەکانمان', bdn: 'کەنیێن مە' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 28,
    },
    {
      key: 'row6',
      label: { ar: 'عنوان الصف السادس', en: 'Sixth row title', ckb: 'ناونیشانی ڕیزی شەشەم', bdn: 'ناڤونیشانێ رێزا شەشێ' },
      ar: 'إلى الأبد',
      versions: { en: 'Forever', ckb: 'بۆ هەمیشە', bdn: 'بۆ هەروهەر' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 28,
    },
  ],
  // Six rows of six, tall posters and wide stills in turn; each row is a set (a package sells 1, 3 or 6 sets in Admin).
  // Each set fills on its own: a customer can fill the third row and leave the second empty.
  photos: {
    max: 36,
    min: 1,
    set: 6,
    aspect: TALL,
    frames: Array.from({ length: 36 }, (_, i) => ({ aspect: Math.floor(i / 6) % 2 === 0 ? TALL : WIDE })),
  },
});

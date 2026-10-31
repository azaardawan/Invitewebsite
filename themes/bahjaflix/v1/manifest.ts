import { defineTheme } from '@/theme-sdk/manifest';

/**
 * BAHJAFLIX (Couples): the couple's own page, made like a streaming app's title page (owner, 2026-10-31). Not an
 * invitation: no date, venue or replies. At the top their one video plays (feature `video`), with the BAHJAFLIX logo,
 * the title they gave it, "starring" with their names and their story; under it three rows of their photos (tall,
 * wide, tall), each opening on its own with its title and few words. On a computer: a side rail, a split hero and
 * rows that page with arrows and grow on hover; on a phone: a big video card, rows to swipe and a bottom bar.
 * A template design: the customer fills it in place (`editor: 'template'`), so every text is an `<EditableText>`.
 */
const allFields = ['person_1_name', 'person_2_name', 'invitation_message'] as const;

const TALL = 2 / 3;
const WIDE = 1.6;

export default defineTheme({
  key: 'bahjaflix',
  version: 1,
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
  ],
  // Three rows of six: tall posters, wide stills, tall posters. A package may sell fewer (Admin): the rows fill in order.
  photos: {
    max: 18,
    min: 1,
    aspect: TALL,
    frames: [...Array.from({ length: 6 }, () => ({ aspect: TALL })), ...Array.from({ length: 6 }, () => ({ aspect: WIDE })), ...Array.from({ length: 6 }, () => ({ aspect: TALL }))],
  },
});

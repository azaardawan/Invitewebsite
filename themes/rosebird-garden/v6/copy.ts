import type { InvitationLocale } from '@/theme-sdk';

/**
 * Little Rose (owner's edit of Rosebird Garden, 2026-11-02): the designer's Arabic and English lines; Sorani and Badini
 * written for it (auto-approved, docs/translations/KURDISH_REVIEW.md). The customer's parts: the baby's and father's
 * names, the date of birth, the connector «بنت» and the birth order (manifest `wording`, as in v2–v3). In Kurdish the
 * praise and the du'a stay in Arabic, as the owner's designs write them.
 */

/** «وهبنا الله … أفراحنا وأميرتنا …»: the customer picks the birth order; first is the default. */
export const ORDINAL = [
  ['أوّل', 'الأولى'],
  ['ثاني', 'الثانية'],
  ['ثالث', 'الثالثة'],
  ['رابع', 'الرابعة'],
] as const;
const orderLine = ([n, the]: readonly [string, string]) => `وهبنـــا الله ${n} أفراحنـــا وأميرتنـــا ${the}`;
export const ORDER = { ar: orderLine(ORDINAL[0]), options: ORDINAL.slice(1).map(orderLine), custom: false } as const;

/** «daughter of»: each language's own word by default; «بنت» and the customer's own word are choices. */
export const SON_OF = { ar: 'بنت', versions: { en: 'Daughter of', ckb: 'کچی', bdn: 'کچا' }, defaultIn: ['en', 'ckb', 'bdn'] } as const;

/** Which birth order the customer's line names (0 = first). */
export function orderIndex(line: string | undefined) {
  const i = ORDINAL.findIndex(([n]) => line?.includes(n));
  return i < 0 ? 0 : i;
}

const en = {
  introLabel: 'With love, we share our joy',
  praise: 'With grateful hearts, we welcome our beautiful blessing.',
  welcome: 'Welcome, little one',
  heroEnding: 'So little in our arms. So big in our hearts.',
  discover: 'Our little story',
  coverLabel: 'A little announcement',
  coverTitle1: 'A little arrival,',
  coverTitle2: 'a whole lot of love.',
  open: 'Open the announcement',
  madeWithLove: 'With love, from our family to yours',
  storyLabel: 'The sweetest new beginning',
  storyTitle1: 'Our {order} joy.',
  storyTitle2: 'Our little princess.',
  storyBody:
    'Our hearts have found a whole new kind of love. With gratitude and endless joy, we welcome our little girl — a beautiful blessing and the beginning of our favourite chapter.',
  storySignature: 'Thankful for the sweetest gift',
  detailsLabel: 'Small details, forever memories',
  detailsTitle: 'The day our world changed',
  memoryLabel: 'The moments we keep',
  memoryTitle1: 'A little picture.',
  memoryTitle2: 'A big memory.',
  memoryBody: 'Her first little looks, her tiny fingers, that very first cuddle. The details we wish we could keep forever.',
  blessingLabel: 'A wish from the heart',
  blessing: 'May her life be filled with love, kindness and blessings, wherever she goes.',
  closingLove: 'With all our love,',
  familyOf: 'The family of',
  closingSmall: 'A little beginning. An endless love.',
  wishesLabel: 'Your wishes',
  replay: 'Open it again',
  familyAlt: 'Watercolour parents with their sleeping newborn in a blush-pink bassinet',
  photoAlt: 'Our little one',
};

export type Copy = typeof en & {
  /** The birth orders (first … fourth), for «{order}». */
  orders: readonly string[];
  /** «N days of love» (n ≥ 0), with the number already in the invitation's digits. */
  days: (n: number, digits: string) => string;
};

const COPY: Record<InvitationLocale, Copy> = {
  ar: {
    introLabel: 'بكل الحب نشارككم فرحتنا',
    praise: 'الحمد لله على تمام النعمة واكتمال المنّة',
    welcome: 'أهلاً بصغيرتنا',
    heroEnding: 'صغيرةٌ بين أيدينا، كبيرةٌ في قلوبنا',
    discover: 'حكاية فرحتنا',
    coverLabel: 'بشارة مولودة',
    coverTitle1: 'خبرٌ صغير',
    coverTitle2: 'وفرحةٌ كبيرة',
    open: 'افتح البشارة',
    madeWithLove: 'بكل الحب، من عائلتنا إليكم',
    storyLabel: 'بداية أجمل حكاية',
    storyTitle1: '{n} أفراحنا',
    storyTitle2: 'وأميرتنا {the}',
    storyBody: 'الحمد لله الذي جعل لنا من زينة الحياة نصيباً، ومن البنات رحمةً ونوراً. وهبنا الله {n} أفراحنا وأميرتنا {the}، فامتلأت بها أيامنا حباً.',
    storySignature: 'الحمد لله على أجمل العطايا',
    detailsLabel: 'تفاصيل صغيرة، ذكرى لا تُنسى',
    detailsTitle: 'يوم أشرقت حياتنا',
    memoryLabel: 'نحتفظ بأجمل اللحظات',
    memoryTitle1: 'صورة صغيرة',
    memoryTitle2: 'لذكرى كبيرة',
    memoryBody: 'أولى نظراتها، أصابعها الصغيرة، وأول حضن. تفاصيل نودّ أن تبقى معنا دائماً.',
    blessingLabel: 'دعوة من القلب',
    blessing: 'جعلها الله فرحةً وبركةً، وغيثاً أينما حلّت.',
    closingLove: 'بكل الحب',
    familyOf: 'عائلة',
    closingSmall: 'بداية صغيرة، وحبّ لا نهاية له',
    wishesLabel: 'تهانيكم',
    replay: 'شاهد البشارة مجدداً',
    familyAlt: 'رسم مائي للأبوين مع مولودتهما النائمة في مهد وردي',
    photoAlt: 'صورة صغيرتنا',
    orders: ['الأولى', 'الثانية', 'الثالثة', 'الرابعة'],
    days: (n, d) => (n === 0 ? 'أول يوم من الحب' : n === 1 ? 'يومٌ من الحب' : n === 2 ? 'يومان من الحب' : n <= 10 ? `${d} أيام من الحب` : `${d} يوماً من الحب`),
  },
  en: {
    ...en,
    orders: ['first', 'second', 'third', 'fourth'],
    days: (n, d) => (n === 0 ? 'Our very first day of love' : `${d} ${n === 1 ? 'day' : 'days'} of love`),
  },
  ckb: {
    introLabel: 'بە هەموو خۆشەویستییەوە خۆشییەکەمان لەگەڵتان بەش دەکەین',
    praise: 'الحمد لله على تمام النعمة واكتمال المنّة',
    welcome: 'بەخێربێیت بچکۆلەکەمان',
    heroEnding: 'لە باوەشماندا بچووکە، لە دڵماندا گەورەیە',
    discover: 'چیرۆکی خۆشییەکەمان',
    coverLabel: 'مژدەی لەدایکبوون',
    coverTitle1: 'هەواڵێکی بچووک',
    coverTitle2: 'و خۆشییەکی گەورە',
    open: 'مژدەکە بکەرەوە',
    madeWithLove: 'بە خۆشەویستییەوە، لە خێزانەکەمانەوە بۆ ئێوە',
    storyLabel: 'سەرەتای جوانترین چیرۆک',
    storyTitle1: '{order} خۆشیمان',
    storyTitle2: 'کچە شازادە بچکۆلەکەمان',
    storyBody: 'سوپاس بۆ خودا کە لە جوانییەکانی ژیان بەشێکی پێ بەخشین. خودا {order} خۆشیمانی پێ بەخشین، و ڕۆژەکانمانی پڕ کرد لە خۆشەویستی.',
    storySignature: 'سوپاس بۆ خودا بۆ جوانترین بەخشش',
    detailsLabel: 'وردەکاریی بچووک، یادەوەریی هەمیشەیی',
    detailsTitle: 'ئەو ڕۆژەی ژیانمان ڕووناک بوو',
    memoryLabel: 'جوانترین ساتەکان دەپارێزین',
    memoryTitle1: 'وێنەیەکی بچووک',
    memoryTitle2: 'بۆ یادەوەرییەکی گەورە',
    memoryBody: 'یەکەم سەیرکردنەکانی، پەنجە بچکۆلەکانی و یەکەم باوەش. ئەو وردەکارییانەی دەمانەوێت هەمیشە لەگەڵمان بن.',
    blessingLabel: 'دوعایەک لە دڵەوە',
    blessing: 'جعلها الله فرحةً وبركةً، وغيثاً أينما حلّت.',
    closingLove: 'بە هەموو خۆشەویستییەوە',
    familyOf: 'خێزانی',
    closingSmall: 'سەرەتایەکی بچووک و خۆشەویستییەکی بێ کۆتایی',
    wishesLabel: 'پیرۆزباییەکانتان',
    replay: 'دووبارە مژدەکە ببینەوە',
    familyAlt: 'وێنەی ئاوی دایک و باوک لەگەڵ کۆرپە نووستووەکەیان لە بێشکەیەکی پەمەییدا',
    photoAlt: 'وێنەی بچکۆلەکەمان',
    orders: ['یەکەم', 'دووەم', 'سێیەم', 'چوارەم'],
    days: (n, d) => (n === 0 ? 'یەکەم ڕۆژی خۆشەویستی' : `${d} ڕۆژ لە خۆشەویستی`),
  },
  bdn: {
    introLabel: 'ب هەمی ڤیانێ دلخۆشیا خۆ دگەل هەوە پارڤە دکەین',
    praise: 'الحمد لله على تمام النعمة واكتمال المنّة',
    welcome: 'ب خێر بێی بچووکا مە',
    heroEnding: 'د هەمێزا مە دا بچووکە، د دلێ مە دا مەزنە',
    discover: 'چیرۆکا دلخۆشیا مە',
    coverLabel: 'مزگینیا ژدایکبوونێ',
    coverTitle1: 'نووچەیەکا بچووک',
    coverTitle2: 'و دلخۆشیەکا مەزن',
    open: 'مزگینیێ ڤەکە',
    madeWithLove: 'ب ڤیان، ژ مالباتا مە بۆ هەوە',
    storyLabel: 'دەستپێکا جوانترین چیرۆکێ',
    storyTitle1: '{order} دلخۆشیا مە',
    storyTitle2: 'شاهزادا مە یا بچووک',
    storyBody: 'سوپاس بۆ خودێ کو ژ جوانیێن ژیانێ پشکەک دا مە. خودێ {order} دلخۆشیا مە دا مە، و ڕۆژێن مە ب ڤیانێ تژی کرن.',
    storySignature: 'سوپاس بۆ خودێ بۆ جوانترین دیاری',
    detailsLabel: 'هوویرکاریێن بچووک، بیرهاتنێن هەروهەر',
    detailsTitle: 'ئەو ڕۆژا ژیانا مە ڕووناک کری',
    memoryLabel: 'جوانترین دەمان دپارێزین',
    memoryTitle1: 'وێنەیەکێ بچووک',
    memoryTitle2: 'بۆ بیرهاتنەکا مەزن',
    memoryBody: 'ئێکەمین بەرێن وێ، تبلێن وێ یێن بچووک، و ئێکەمین هەمێز. ئەو هوویرکاریێن دڤێین هەردەم دگەل مە بمینن.',
    blessingLabel: 'دوعایەک ژ دلی',
    blessing: 'جعلها الله فرحةً وبركةً، وغيثاً أينما حلّت.',
    closingLove: 'ب هەمی ڤیانێ',
    familyOf: 'مالباتا',
    closingSmall: 'دەستپێکەکا بچووک، و ڤیانەکا بێ دوماهی',
    wishesLabel: 'پیرۆزباهیێن هەوە',
    replay: 'جارەکا دی مزگینیێ ببینە',
    familyAlt: 'وێنەیێ ئاڤی یێ دەیک و بابان دگەل زاروکێ وان یێ نڤستی د بێشکەکا پەمبەیی دا',
    photoAlt: 'وێنێ بچووکا مە',
    orders: ['ئێکەمین', 'دوویەمین', 'سێیەمین', 'چارەمین'],
    days: (n, d) => (n === 0 ? 'ئێکەمین ڕۆژا ڤیانێ' : `${d} ڕۆژ ژ ڤیانێ`),
  },
};

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

/** The story's two title lines and body with the customer's birth order. */
export function storyLines(t: Copy, locale: InvitationLocale, order: string | undefined) {
  const i = orderIndex(order);
  const [n, the] = ORDINAL[i]!;
  const fill = (s: string) => s.replace('{n}', n).replace('{the}', the).replace('{order}', t.orders[i]!);
  return { title1: fill(t.storyTitle1), title2: fill(t.storyTitle2), body: fill(t.storyBody), locale };
}

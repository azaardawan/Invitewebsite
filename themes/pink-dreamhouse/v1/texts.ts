/** The house's default words, in the four languages (the customer changes them in the editor). */
type Words = { ar: string; en: string; ckb: string; bdn: string };

export const ORDINAL: Words[] = [
  { ar: 'الأولى', en: 'first', ckb: 'یەکەم', bdn: 'ئێکێ' },
  { ar: 'الثانية', en: 'second', ckb: 'دووەم', bdn: 'دووێ' },
  { ar: 'الثالثة', en: 'third', ckb: 'سێیەم', bdn: 'سێیێ' },
  { ar: 'الرابعة', en: 'fourth', ckb: 'چوارەم', bdn: 'چارێ' },
  { ar: 'الخامسة', en: 'fifth', ckb: 'پێنجەم', bdn: 'پێنجێ' },
  { ar: 'السادسة', en: 'sixth', ckb: 'شەشەم', bdn: 'شەشێ' },
];

/** The rooms' names, in photo order (living room, bedroom, kitchen, vanity, cinema, secret suite). */
export const ROOM_NAMES: Words[] = [
  { ar: 'غرفة المعيشة', en: 'Birthday Living Room', ckb: 'ژووری دانیشتن', bdn: 'ژوورا روینشتنێ' },
  { ar: 'غرفة النوم', en: 'Bestie Bedroom', ckb: 'ژووری نووستنی هاوڕێ', bdn: 'ژوورا نڤستنێ یا هەڤالێ' },
  { ar: 'مقهى المطبخ الوردي', en: 'Pink Kitchen Café', ckb: 'کافێی چێشتخانەی پەمەیی', bdn: 'کافێیا مەتبەخا پەمبەیی' },
  { ar: 'استوديو التجميل', en: 'Glam Vanity Studio', ckb: 'ستۆدیۆی جوانکاری', bdn: 'ستۆدیۆیا جوانکاریێ' },
  { ar: 'سينما الأصدقاء', en: 'Bestie Cinema', ckb: 'سینەمای هاوڕێیان', bdn: 'سینەمایا هەڤالان' },
  { ar: 'الجناح السري', en: 'Secret Birthday Suite', ckb: 'ژووری نهێنی', bdn: 'ژوورا نهێنی' },
];
/** For friends: the rooms that speak of a birthday say the house is theirs instead. */
export const FRIENDS_ROOM_NAMES: Partial<Record<number, Words>> = {
  0: { ar: 'غرفة المعيشة', en: 'Bestie Living Room', ckb: 'ژووری دانیشتنی هاوڕێیان', bdn: 'ژوورا روینشتنێ یا هەڤالان' },
  5: { ar: 'الجناح السري', en: 'Secret Bestie Suite', ckb: 'ژووری نهێنی هاوڕێیان', bdn: 'ژوورا نهێنی یا هەڤالان' },
};

/** A message in each drawer (the first two downstairs, then the kitchen, the vanity, the cinema's two, the suite's two). */
export const DRAWER_TEXTS: Words[] = [
  { ar: 'أول يوم تعارفنا فيه… ما زلت أبتسم كلما تذكرته.', en: 'Remember the day we met? I still smile every time I think of it.', ckb: 'ئەو ڕۆژەت لە بیرە کە یەکترمان ناسی؟ هێشتا هەر کە بیری دەکەمەوە پێدەکەنم.', bdn: 'تە ئەو ڕۆژ ل بیرە دەمێ مە ئێک ناسی؟ هێشتا هەر دەما بیرا وێ دکەم دکەنم.' },
  { ar: 'شكراً لأنك دائماً بجانبي، في الأيام الحلوة والصعبة.', en: 'Thank you for always being there, on the good days and the hard ones.', ckb: 'سوپاس کە هەمیشە لە تەنیشتمی، لە ڕۆژە خۆش و سەختەکاندا.', bdn: 'سوپاس کو هەردەم ل رەخ منی، د ڕۆژێن خۆش و ب زەحمەت دا.' },
  { ar: 'كل قهوة شربناها معاً كانت حكاية.', en: 'Every coffee we shared was a little story.', ckb: 'هەموو قاوەیەک کە پێکەوە خواردمانەوە چیرۆکێک بوو.', bdn: 'هەمی قەهوەیێن مە پێکڤە ڤەخواری چیرۆکەک بوون.' },
  { ar: 'لا مرآة تُظهر جمالك كما أراه.', en: 'You are lovelier than any mirror could ever show.', ckb: 'تۆ لە هەر ئاوێنەیەک جوانتری کە نیشانی بدات.', bdn: 'تو ژ هەر نەینکەکێ جوانتری کو نیشان بدەت.' },
  { ar: 'فيلمنا المفضل لا يكتمل إلا معك.', en: 'Our favourite film is never complete without you.', ckb: 'فیلمە دڵخوازەکەمان بەبێ تۆ تەواو نابێت.', bdn: 'فیلما مە یا دلخواز بێی تە تمام نابیت.' },
  { ar: 'الضحكات التي تشاركناها هي أغلى ما أملك.', en: 'The laughs we shared are my greatest treasure.', ckb: 'ئەو پێکەنینانەی پێکەوە کردمان گرانترین شتی منن.', bdn: 'ئەو کەنیێن مە پێکڤە کرین بهاترین تشتێ منن.' },
  { ar: 'وُجدت كل الذكريات… حان وقت فتح الصندوق الذهبي.', en: 'You found every memory… now open the golden chest.', ckb: 'هەموو یادەوەرییەکانت دۆزییەوە… ئێستا سندووقە زێڕینەکە بکەرەوە.', bdn: 'تە هەمی بیرهاتن دیتن… نوکە سندوقا زێڕین ڤەکە.' },
  { ar: 'هذا البيت وكل ما فيه صُنع بحب، لك أنت.', en: 'This house and everything in it was made with love, for you.', ckb: 'ئەم خانووە و هەموو ئەوەی تێیدایە بە خۆشەویستی دروستکرا، بۆ تۆ.', bdn: 'ئەڤ خانیە و هەمی تشتێن تێدا ب ڤیانێ هاتنە چێکرن، بۆ تە.' },
];

/** The gift's words, the cupcake's note, the mirror's message and the chest's last words. */
export const EXTRA_TEXTS: (Words & { key: string; label: Words })[] = [
  {
    key: 'gift',
    label: { ar: 'رسالة الهدية', en: 'The gift’s message', ckb: 'نامەی دیارییەکە', bdn: 'نامەیا دیاریێ' },
    ar: 'عيد ميلاد سعيد! هذا البيت الصغير مليء بذكرياتنا، وفي كل درج ذكرى تنتظرك.',
    en: 'Happy birthday! This little house is full of our memories. Walk around and open every drawer.',
    ckb: 'ڕۆژی لەدایکبوونت پیرۆز! ئەم خانووە بچووکە پڕە لە یادەوەرییەکانمان. پیاسەی تێدا بکە و هەموو چەکمەجەیەک بکەرەوە.',
    bdn: 'ڕۆژا ژدایکبوونا تە پیرۆز بیت! ئەڤ خانیێ بچووک تژیە ژ بیرهاتنێن مە. تێدا بگەڕە و هەمی چەکمەجان ڤەکە.',
  },
  {
    key: 'cupcake',
    label: { ar: 'ملاحظة الكب كيك', en: 'The cupcake’s note', ckb: 'تێبینی کەپ کەیکەکە', bdn: 'تێبینیا کەپ کەیکێ' },
    ar: 'حلوة مثلك تماماً.',
    en: 'Just as sweet as you.',
    ckb: 'هێندەی تۆ شیرین.',
    bdn: 'هندی تە شرین.',
  },
  {
    key: 'mirror',
    label: { ar: 'رسالة المرآة', en: 'The mirror’s message', ckb: 'نامەی ئاوێنەکە', bdn: 'نامەیا نەینکێ' },
    ar: 'هنا… أجمل وجه في هذا البيت.',
    en: 'Look… the loveliest face in this house.',
    ckb: 'سەیر بکە… جوانترین ڕوو لەم خانووەدا.',
    bdn: 'بەرێ خۆ بدە… جوانترین ڕوو د ڤی خانی دا.',
  },
  {
    key: 'chest',
    label: { ar: 'رسالة الصندوق الذهبي', en: 'The golden chest’s message', ckb: 'نامەی سندووقە زێڕینەکە', bdn: 'نامەیا سندوقا زێڕین' },
    ar: 'كل عام وأنت بألف خير وسعادة. أحبك دائماً.',
    en: 'May every year be brighter and happier for you. Love you always.',
    ckb: 'هەموو ساڵێک جوانتر و دڵخۆشتر بیت. هەمیشە خۆشم دەوێیت.',
    bdn: 'هەمی سالان جوانتر و دلخۆشتر بی. هەردەم من تو دڤێی.',
  },
];

import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own words: the museum's buttons and labels around the couple's content. The couple's texts are their
 * fields (names, story) and the design's changeable lines (the museum's name, the date line, the rooms' names, in the
 * manifest). The Kurdish is approved automatically (owner rule) and listed in docs/translations/KURDISH_REVIEW.md,
 * batch 56.
 */
const ar = {
  /** Under the names on the cover. */
  welcome: 'أهلاً بكم في متحفنا',
  loading: 'جارٍ فتح المتحف…',
  /** On a phone held upright (the museum is walked sideways). */
  rotate: 'أديروا الهاتف بالعرض للتجوّل في المتحف',
  next: 'الصورة التالية',
  previous: 'السابقة',
  entrance: 'المدخل',
  story: 'قصتنا',
  close: 'إغلاق',
  video: 'شاهدوا الفيديو',
  /** How to walk (a computer, a phone). */
  hintKeys: 'اسحبوا للنظر، وامشوا بالأسهم. اضغطوا على صورة للاقتراب منها.',
  hintTouch: 'اسحبوا للنظر، وامشوا بالدائرة. اضغطوا على صورة للاقتراب منها.',
  /** The list of photos at the bottom. */
  guide: 'صور المتحف',
  /** A room's heading when its name was left empty (with its number). */
  room: 'القاعة',
  /** In the editor. */
  addPhoto: 'أضيفوا صورة',
  addVideo: 'أضيفوا فيديو (يظهر على شاشة المدخل)',
  namesHint: 'الاسم',
  storyHint: 'اكتبوا قصتكما في سطرين أو ثلاثة…',
  roomHint: 'اسم القاعة',
  roomTextHint: 'كلمات قليلة عن هذه القاعة…',
  mapTitle: 'خريطة متحفكم',
  photoHint: 'اضغطوا على إطار لإضافة صورة، ثم اكتبوا عنوانها ووصفاً قصيراً يظهر تحتها في المتحف.',
  leftWall: 'الجدار الأيسر',
  rightWall: 'الجدار الأيمن',
  doorway: 'مدخل القاعة',
  titleHint: 'اسم المتحف',
  sinceHint: 'سطر التاريخ (مثلاً: منذ 2019)',
  editorNote: 'القاعات الذهبية ضمن باقتكم. املؤوا المتحف قاعةً قاعة: اسم القاعة ووصفها، ثم صورها الثماني كما تُعلَّق على جدرانها.',
  /** Example titles and words for the sample photos (the customer writes their own). */
  samples: [
    ['أول لقاء', 'اليوم الذي بدأ فيه كل شيء.'],
    ['على الشاطئ', 'مساء هادئ والبحر أمامنا.'],
    ['الخطوبة', 'اللحظة التي قلنا فيها: نعم.'],
    ['ليلة الزفاف', 'أجمل ليلة في حياتنا.'],
    ['سفرتنا الأولى', 'مدينة جديدة وذكريات لا تُنسى.'],
    ['معاً', 'ضحكة تكفي لعمر كامل.'],
  ],
  sampleStory: 'التقينا صدفة، ومنذ ذلك اليوم صار كل يوم معاً ذكرى تستحق أن تُعلَّق على جدار. هذا متحفنا الصغير، أهلاً بكم.',
};

export type Copy = { [K in keyof typeof ar]: K extends 'samples' ? readonly (readonly string[])[] : string };

const en: Copy = {
  welcome: 'Welcome to our museum',
  loading: 'Opening the museum…',
  rotate: 'Turn your phone sideways to walk through the museum',
  next: 'Next photo',
  previous: 'Previous',
  entrance: 'Entrance',
  story: 'Our story',
  close: 'Close',
  video: 'Watch the video',
  hintKeys: 'Drag to look around and walk with the arrow keys. Click a photo to walk up to it.',
  hintTouch: 'Drag to look around and walk with the circle. Tap a photo to walk up to it.',
  guide: 'Photos in the museum',
  room: 'Room',
  addPhoto: 'Add a photo',
  addVideo: 'Add a video (it plays on the entrance screen)',
  namesHint: 'Name',
  storyHint: 'Write your story in two or three lines…',
  roomHint: 'Room name',
  roomTextHint: 'A few words about this room…',
  mapTitle: 'Your museum’s plan',
  photoHint: 'Tap a frame to add a photo, then write its title and a short description, shown under it in the museum.',
  leftWall: 'Left wall',
  rightWall: 'Right wall',
  doorway: 'Way in',
  titleHint: 'Museum name',
  sinceHint: 'Date line (e.g. Since 2019)',
  editorNote: 'The gold rooms are in your package. Fill the museum room by room: the room’s name and description, then its eight photos as they hang on its walls.',
  samples: [
    ['First meeting', 'The day it all began.'],
    ['On the beach', 'A quiet evening by the sea.'],
    ['Engagement', 'The moment we said yes.'],
    ['Our wedding night', 'The most beautiful night of our lives.'],
    ['Our first trip', 'A new city and memories to keep.'],
    ['Together', 'One laugh is enough for a lifetime.'],
  ],
  sampleStory: 'We met by chance, and since that day every day together has been a memory worth hanging on a wall. This is our little museum. Welcome.',
};

const ckb: Copy = {
  welcome: 'بەخێربێن بۆ مۆزەخانەکەمان',
  loading: 'مۆزەخانەکە دەکرێتەوە…',
  rotate: 'مۆبایلەکەتان بە پانی بسووڕێنن بۆ گەڕان لە مۆزەخانەکەدا',
  next: 'وێنەی دواتر',
  previous: 'پێشوو',
  entrance: 'دەروازە',
  story: 'چیرۆکەکەمان',
  close: 'داخستن',
  video: 'سەیری ڤیدیۆکە بکەن',
  hintKeys: 'ڕابکێشن بۆ سەیرکردن، و بە تیرەکان بڕۆن. کرتە لە وێنەیەک بکەن بۆ نزیکبوونەوە لێی.',
  hintTouch: 'ڕابکێشن بۆ سەیرکردن، و بە بازنەکە بڕۆن. دەست لە وێنەیەک بدەن بۆ نزیکبوونەوە لێی.',
  guide: 'وێنەکانی مۆزەخانە',
  room: 'هۆڵ',
  addPhoto: 'وێنەیەک زیاد بکەن',
  addVideo: 'ڤیدیۆیەک زیاد بکەن (لەسەر شاشەی دەروازە پیشان دەدرێت)',
  namesHint: 'ناو',
  storyHint: 'چیرۆکەکەتان لە دوو بۆ سێ دێڕدا بنووسن…',
  roomHint: 'ناوی هۆڵ',
  roomTextHint: 'چەند وشەیەک دەربارەی ئەم هۆڵە…',
  mapTitle: 'نەخشەی مۆزەخانەکەتان',
  photoHint: 'دەست لە چوارچێوەیەک بدەن بۆ زیادکردنی وێنە، پاشان ناونیشانەکەی و وەسفێکی کورت بنووسن کە لە مۆزەخانەکەدا لەژێریدا دەردەکەوێت.',
  leftWall: 'دیواری چەپ',
  rightWall: 'دیواری ڕاست',
  doorway: 'دەرگای هۆڵ',
  titleHint: 'ناوی مۆزەخانە',
  sinceHint: 'دێڕی بەروار (بۆ نموونە: لە ٢٠١٩ەوە)',
  editorNote: 'هۆڵە زێڕینەکان لە پاکێجەکەتاندان. مۆزەخانەکە هۆڵ بە هۆڵ پڕ بکەنەوە: ناو و وەسفی هۆڵەکە، پاشان هەشت وێنەکەی وەک لەسەر دیوارەکانی هەڵدەواسرێن.',
  samples: [
    ['یەکەم دیدار', 'ئەو ڕۆژەی هەموو شتێک دەستی پێکرد.'],
    ['لە کەناری دەریا', 'ئێوارەیەکی هێمن و دەریا لەبەردەممان.'],
    ['دەستگیرانی', 'ئەو ساتەی گوتمان: بەڵێ.'],
    ['شەوی زەماوەند', 'جوانترین شەوی ژیانمان.'],
    ['یەکەم گەشتمان', 'شارێکی نوێ و یادەوەرییەکی لەبیرنەکراو.'],
    ['پێکەوە', 'پێکەنینێک بۆ تەواوی تەمەن بەسە.'],
  ],
  sampleStory: 'بە ڕێکەوت یەکترمان بینی، و لەو ڕۆژەوە هەموو ڕۆژێکی پێکەوە بووە یادەوەرییەک کە شایەنی هەڵواسینە لەسەر دیوار. ئەمە مۆزەخانە بچووکەکەمانە، بەخێربێن.',
};

const bdn: Copy = {
  welcome: 'ب خێر بێن بۆ مۆزەخانەیا مە',
  loading: 'مۆزەخانە دهێتە ڤەکرن…',
  rotate: 'مۆبایلا خۆ ب پانی بزڤڕینن بۆ گەڕیانێ د مۆزەخانێدا',
  next: 'وێنێ دویڤدا',
  previous: 'یێ بەری',
  entrance: 'دەرگەهـ',
  story: 'چیرۆکا مە',
  close: 'گرتن',
  video: 'سەحکەنە ڤیدیۆیێ',
  hintKeys: 'بکێشن بۆ دیتنێ، و ب تیران بچن. کلیک ل سەر وێنەکی بکەن دا نێزیکی وی ببن.',
  hintTouch: 'بکێشن بۆ دیتنێ، و ب بازنێ بچن. دەستێ خۆ ل سەر وێنەکی بدەن دا نێزیکی وی ببن.',
  guide: 'وێنێن مۆزەخانێ',
  room: 'هۆل',
  addPhoto: 'وێنەکی زێدە بکەن',
  addVideo: 'ڤیدیۆیەکێ زێدە بکەن (ل سەر شاشا دەرگەهی دهێتە نیشاندان)',
  namesHint: 'ناڤ',
  storyHint: 'چیرۆکا خۆ د دوو یان سێ رێزاندا بنڤیسن…',
  roomHint: 'ناڤێ هۆلێ',
  roomTextHint: 'چەند پەیڤەک ل دۆر ڤێ هۆلێ…',
  mapTitle: 'نەخشەیا مۆزەخانەیا هەوە',
  photoHint: 'دەستێ خۆ ل سەر چوارچێوەیەکێ بدەن دا وێنەکی زێدە بکەن، پاشان ناڤونیشانێ وی و وەسفەکا کورت بنڤیسن کو د مۆزەخانێدا ل بن وی دیار دبیت.',
  leftWall: 'دیوارێ چەپێ',
  rightWall: 'دیوارێ ڕاستێ',
  doorway: 'دەرگەهێ هۆلێ',
  titleHint: 'ناڤێ مۆزەخانێ',
  sinceHint: 'رێزا رێکەفتێ (بۆ نموونە: ژ ٢٠١٩ێ)',
  editorNote: 'هۆلێن زێڕین د پاکێجا هەوەدا نە. مۆزەخانێ هۆل ب هۆل تژی بکەن: ناڤ و وەسفا هۆلێ، پاشان هەشت وێنێن وێ وەکی ل سەر دیوارێن وێ دهێنە هەلاویستن.',
  samples: [
    ['ئێکەم دیدار', 'ئەو ڕۆژا هەمی تشت پێ دەستپێکری.'],
    ['ل بەر دەریایێ', 'ئێڤارەکا هێمن و دەریا ل بەرامبەری مە.'],
    ['دەستگیرانی', 'ئەو دەمێ مە گۆتی: بەلێ.'],
    ['شەڤا داوەتێ', 'جوانترین شەڤا ژیانا مە.'],
    ['ئێکەم گەشتا مە', 'باژێرەکێ نوو و بیرهاتنێن ژبیرنەکری.'],
    ['پێکڤە', 'کەنیەک بۆ هەمی ژیانێ بەسە.'],
  ],
  sampleStory: 'ب ڕێکەفت مە ئێک دیت، و ژ وێ ڕۆژێ هەر ڕۆژەکا پێکڤە بوویە بیرهاتنەک کو هێژایی هەلاویستنێ یە ل سەر دیواری. ئەڤە مۆزەخانەیا مە یا بچووکە، ب خێر بێن.',
};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb, bdn };

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale];
}

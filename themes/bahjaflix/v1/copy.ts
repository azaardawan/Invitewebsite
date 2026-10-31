import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's own words: the streaming app's buttons and labels around the couple's content. The couple's texts are
 * their fields (names, story) and the design's changeable lines (title, rows… in the manifest). The Kurdish is
 * approved automatically (owner rule) and listed in docs/translations/KURDISH_REVIEW.md, batch 46.
 */
const ar = {
  home: 'الرئيسية',
  video: 'الفيديو',
  play: 'تشغيل',
  moreInfo: 'مزيد من المعلومات',
  info: 'معلومات',
  starring: 'البطولة:',
  match: 'تطابق 100%',
  close: 'إغلاق',
  previous: 'السابق',
  next: 'التالي',
  mute: 'كتم الصوت',
  unmute: 'تشغيل الصوت',
  /** In the editor, on the empty places. */
  addVideo: 'أضيفوا فيديو واحداً (حتى دقيقة)',
  addPhoto: 'أضيفوا صورة',
  namesHint: 'الاسم',
  storyHint: 'اكتبوا هنا قصتكما في سطرين أو ثلاثة…',
  storyLabel: 'القصة (تظهر عند الضغط على «معلومات»)',
  /** Example titles and words for the sample photos (the customer writes their own). */
  samples: [
    ['كورنيش الغروب', 'مساء على الكورنيش، والشمس تغيب خلفنا.'],
    ['ليلة على الميناء', 'أول صورة لنا معاً، ولم نكن نعرف بعدُ أنها البداية.'],
    ['بالأبيض والأسود', 'لقطة كلاسيكية لا تُنسى.'],
    ['دفء المساء', 'ضحكة ودفء وبحر.'],
    ['الخاتم', 'اللحظة التي قالت فيها: نعم.'],
    ['المراكب', 'نزهة هادئة بين المراكب.'],
  ],
  /** The sample story when the customer has not written one (samples only). */
  sampleStory: 'الحضور الثابت الذي يمشي بجانبي في كل فصل من فصول الحياة. قلبك الذي أستند إليه، وصوتك الذي أثق به، وحبك الذي يجعل العالم أكثر دفئاً وإشراقاً.',
};

export type Copy = { [K in keyof typeof ar]: K extends 'samples' ? readonly (readonly string[])[] : string };

const en: Copy = {
  home: 'Home',
  video: 'Video',
  play: 'Play',
  moreInfo: 'More info',
  info: 'Info',
  starring: 'Starring:',
  match: '100% match',
  close: 'Close',
  previous: 'Previous',
  next: 'Next',
  mute: 'Mute',
  unmute: 'Unmute',
  addVideo: 'Add one video (up to a minute)',
  addPhoto: 'Add a photo',
  namesHint: 'Name',
  storyHint: 'Write your story here in two or three lines…',
  storyLabel: 'The story (shown under “Info”)',
  samples: [
    ['Sunset on the corniche', 'An evening by the sea, the sun going down behind us.'],
    ['A night at the harbour', 'Our first photo together; we didn’t know yet it was the start.'],
    ['Black and white', 'A classic we will never forget.'],
    ['Warm evening', 'Laughter, warmth and the sea.'],
    ['The ring', 'The moment she said yes.'],
    ['The boats', 'A quiet walk among the boats.'],
  ],
  sampleStory: 'The steady presence beside me through every season of life. Your heart I lean on, your voice I trust, and your love that makes the world warmer and brighter.',
};

const ckb: Copy = {
  home: 'سەرەکی',
  video: 'ڤیدیۆ',
  play: 'لێدان',
  moreInfo: 'زانیاری زیاتر',
  info: 'زانیاری',
  starring: 'ئەکتەران:',
  match: '١٠٠٪ گونجاو',
  close: 'داخستن',
  previous: 'پێشوو',
  next: 'دواتر',
  mute: 'بێدەنگکردن',
  unmute: 'دەنگ',
  addVideo: 'یەک ڤیدیۆ زیاد بکەن (تا خولەکێک)',
  addPhoto: 'وێنەیەک زیاد بکەن',
  namesHint: 'ناو',
  storyHint: 'چیرۆکەکەتان لێرە لە دوو سێ دێڕدا بنووسن…',
  storyLabel: 'چیرۆکەکە (لە «زانیاری»دا دەردەکەوێت)',
  samples: [
    ['ئاوابوونی کۆرنیش', 'ئێوارەیەک لە کەناری دەریا، خۆر لە پشتمانەوە ئاوا دەبێت.'],
    ['شەوێک لە بەندەر', 'یەکەم وێنەمان پێکەوە، هێشتا نەماندەزانی سەرەتایە.'],
    ['ڕەش و سپی', 'وێنەیەکی کلاسیکی کە لەبیر ناچێت.'],
    ['گەرمی ئێوارە', 'پێکەنین و گەرمی و دەریا.'],
    ['ئەڵقەکە', 'ئەو ساتەی گوتی: بەڵێ.'],
    ['بەلەمەکان', 'پیاسەیەکی ئارام لە نێوان بەلەمەکاندا.'],
  ],
  sampleStory: 'ئەو هاوڕێیە جێگیرەی لە هەموو وەرزەکانی ژیاندا لە تەنیشتمە. دڵت کە پشتی پێ دەبەستم، دەنگت کە متمانەی پێ دەکەم، و خۆشەویستییەکەت کە جیهان گەرمتر و ڕووناکتر دەکات.',
};

const bdn: Copy = {
  home: 'سەرەکی',
  video: 'ڤیدیۆ',
  play: 'لێدان',
  moreInfo: 'پتر پێزانین',
  info: 'پێزانین',
  starring: 'ئەکتەر:',
  match: '١٠٠٪ گونجای',
  close: 'گرتن',
  previous: 'یا بەری',
  next: 'یا پشتی',
  mute: 'بێدەنگکرن',
  unmute: 'دەنگ',
  addVideo: 'ئێک ڤیدیۆ زێدە بکەن (هەتا خولەکەکێ)',
  addPhoto: 'وێنەیەکێ زێدە بکەن',
  namesHint: 'ناڤ',
  storyHint: 'چیرۆکا خۆ ل ڤێرێ د دوو سێ رێزاندا بنڤیسن…',
  storyLabel: 'چیرۆک (د «پێزانین»ێدا دیار دبیت)',
  samples: [
    ['ئاڤابوونا کۆرنیشێ', 'ئێڤارەک ل بەر دەریایێ، رۆژ ل پشت مە ئاڤا دبیت.'],
    ['شەڤەک ل بەندەرێ', 'ئێکەم وێنێ مە پێکڤە، هێشتا مە نەدزانی کو دەستپێکە.'],
    ['رەش و سپی', 'وێنەیەکێ کلاسیک کو ژبیر ناچیت.'],
    ['گەرمیا ئێڤارێ', 'کەنی و گەرمی و دەریا.'],
    ['ئەلقە', 'ئەو دەمێ وێ گۆتی: بەلێ.'],
    ['بەلەم', 'گەشتەکا ئارام د ناڤبەرا بەلەماندا.'],
  ],
  sampleStory: 'ئەو هەڤالێ جێگیر یێ د هەمی وەرزێن ژیانێدا ل تەنشت من. دلێ تە یێ ئەز پشتا خۆ پێ گرێ ددەم، دەنگێ تە یێ ئەز باوەریێ پێ دکەم، و ڤیانا تە یا جیهانێ گەرمتر و رۆناهیتر دکەت.',
};

const COPY: Record<InvitationLocale, Copy> = { ar, en, ckb, bdn };

export function copyFor(locale: InvitationLocale): Copy {
  return COPY[locale] ?? ar;
}

/** The Pink Dreamhouse's own words on screen, in the four languages (birthday, or friends). */
type Locale = 'ar' | 'en' | 'ckb' | 'bdn';

export type Copy = {
  welcome: string;
  happyBirthday: string;
  hintKeys: string;
  hintTouch: string;
  loading: string;
  rotate: string;
  /** "{n} of {m} memories found". */
  memories: string;
  locked: string;
  unlocked: string;
  close: string;
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  stopVideo: string;
  room: string;
  drawer: string;
  fromHeart: string;
  // The editor.
  namesHint: string;
  messageHint: string;
  roomHint: string;
  textHint: string;
  addPhoto: string;
  addVideo: string;
  mapTitle: string;
  editorNote: string;
  drawersTitle: string;
  photosHint: string;
  floorGround: string;
  floorUpper: string;
  notInPackage: string;
};

const BIRTHDAY: Record<Locale, Copy> = {
  ar: {
    welcome: 'بيت صغير مليء بالذكريات',
    happyBirthday: 'عيد ميلاد سعيد',
    hintKeys: 'امشِ بالأسهم، واسحب لتنظر حولك، واضغط على الأشياء لتفتحها',
    hintTouch: 'امشِ بلوحة اللمس، واسحب لتنظر حولك، واضغط على الأشياء لتفتحها',
    loading: 'نفتح البيت…',
    rotate: 'أدر هاتفك بالعرض لتتجول في البيت',
    memories: '{n} من {m} ذكريات',
    locked: 'هذا الباب يُفتح عندما تجد كل الذكريات في الأدراج.',
    unlocked: 'وجدت كل الذكريات! الجناح السري مفتوح الآن.',
    close: 'إغلاق',
    play: 'تشغيل',
    pause: 'إيقاف مؤقت',
    mute: 'كتم الصوت',
    unmute: 'تشغيل الصوت',
    stopVideo: 'إغلاق الفيديو',
    room: 'غرفة',
    drawer: 'درج',
    fromHeart: 'من القلب',
    namesHint: 'الاسم',
    messageHint: 'رسالتك',
    roomHint: 'اسم الغرفة',
    textHint: 'اكتب هنا',
    addPhoto: 'أضف صورة',
    addVideo: 'أضف فيديو',
    mapTitle: 'خريطة البيت',
    editorNote: 'املأ البيت غرفة غرفة: اسمها، صورها، ورسائل أدراجها.',
    drawersTitle: 'رسائل الأدراج',
    photosHint: 'الصور معلقة على الجدار الخلفي، من اليسار إلى اليمين.',
    floorGround: 'الطابق الأرضي',
    floorUpper: 'الطابق العلوي',
    notInPackage: 'ليست في باقتك',
  },
  en: {
    welcome: 'A little house full of memories',
    happyBirthday: 'Happy birthday',
    hintKeys: 'Walk with the arrow keys, drag to look around, tap things to open them',
    hintTouch: 'Walk with the touch pad, drag to look around, tap things to open them',
    loading: 'Opening the house…',
    rotate: 'Turn your phone sideways to walk through the house',
    memories: '{n} of {m} memories found',
    locked: 'This door opens once you have found every memory in the drawers.',
    unlocked: 'You found every memory! The secret suite is open now.',
    close: 'Close',
    play: 'Play',
    pause: 'Pause',
    mute: 'Mute',
    unmute: 'Sound on',
    stopVideo: 'Close the video',
    room: 'Room',
    drawer: 'Drawer',
    fromHeart: 'From the heart',
    namesHint: 'Name',
    messageHint: 'Your message',
    roomHint: 'The room’s name',
    textHint: 'Write here',
    addPhoto: 'Add a photo',
    addVideo: 'Add a video',
    mapTitle: 'The house',
    editorNote: 'Fill the house room by room: its name, its photos and its drawers’ messages.',
    drawersTitle: 'Drawer messages',
    photosHint: 'The photos hang on the back wall, from left to right.',
    floorGround: 'Ground floor',
    floorUpper: 'Upstairs',
    notInPackage: 'Not in your package',
  },
  ckb: {
    welcome: 'خانوویەکی بچووکی پڕ لە یادەوەری',
    happyBirthday: 'ڕۆژی لەدایکبوونت پیرۆز',
    hintKeys: 'بە تیرەکان بڕۆ، ڕایبکێشە بۆ سەیرکردنی دەوروبەر، کرتە لە شتەکان بکە بۆ کردنەوەیان',
    hintTouch: 'بە پەدی دەستلێدان بڕۆ، ڕایبکێشە بۆ سەیرکردنی دەوروبەر، کرتە لە شتەکان بکە بۆ کردنەوەیان',
    loading: 'خانووەکە دەکەینەوە…',
    rotate: 'مۆبایلەکەت بە پانی بسووڕێنە بۆ پیاسەکردن لە خانووەکەدا',
    memories: '{n} لە {m} یادەوەری دۆزرانەوە',
    locked: 'ئەم دەرگایە دەکرێتەوە کاتێک هەموو یادەوەرییەکانی ناو چەکمەجەکان دەدۆزیتەوە.',
    unlocked: 'هەموو یادەوەرییەکانت دۆزییەوە! ژووری نهێنی ئێستا کراوەیە.',
    close: 'داخستن',
    play: 'لێدان',
    pause: 'وەستاندن',
    mute: 'بێدەنگکردن',
    unmute: 'دەنگ',
    stopVideo: 'داخستنی ڤیدیۆکە',
    room: 'ژوور',
    drawer: 'چەکمەجە',
    fromHeart: 'لە دڵەوە',
    namesHint: 'ناو',
    messageHint: 'نامەکەت',
    roomHint: 'ناوی ژوورەکە',
    textHint: 'لێرە بنووسە',
    addPhoto: 'وێنەیەک زیاد بکە',
    addVideo: 'ڤیدیۆیەک زیاد بکە',
    mapTitle: 'خانووەکە',
    editorNote: 'خانووەکە ژوور بە ژوور پڕ بکەرەوە: ناوەکەی، وێنەکانی و نامەکانی چەکمەجەکانی.',
    drawersTitle: 'نامەکانی چەکمەجەکان',
    photosHint: 'وێنەکان لەسەر دیواری دواوە هەڵواسراون، لە چەپەوە بۆ ڕاست.',
    floorGround: 'نهۆمی خوارەوە',
    floorUpper: 'نهۆمی سەرەوە',
    notInPackage: 'لە پاکێجەکەتدا نییە',
  },
  bdn: {
    welcome: 'خانیەکێ بچووک تژی بیرهاتن',
    happyBirthday: 'ڕۆژا ژدایکبوونا تە پیرۆز بیت',
    hintKeys: 'ب تیران بچە، بکێشە دا دەوروبەرێ خۆ ببینی، کرتێ ل تشتان بکە دا ڤەبن',
    hintTouch: 'ب پەدێ دەستلێدانێ بچە، بکێشە دا دەوروبەرێ خۆ ببینی، کرتێ ل تشتان بکە دا ڤەبن',
    loading: 'خانی ڤەدکەین…',
    rotate: 'مۆبایلا خۆ ب پانی بزڤڕینە دا د خانی دا بگەڕی',
    memories: '{n} ژ {m} بیرهاتن هاتنە دیتن',
    locked: 'ئەڤ دەرگەهە ڤەدبیت دەمێ تو هەمی بیرهاتنێن د چەکمەجان دا دبینی.',
    unlocked: 'تە هەمی بیرهاتن دیتن! ژوورا نهێنی نوکە ڤەکریە.',
    close: 'گرتن',
    play: 'لێدان',
    pause: 'راوەستاندن',
    mute: 'بێدەنگکرن',
    unmute: 'دەنگ',
    stopVideo: 'گرتنا ڤیدیۆیێ',
    room: 'ژوور',
    drawer: 'چەکمەجە',
    fromHeart: 'ژ دلی',
    namesHint: 'ناڤ',
    messageHint: 'نامەیا تە',
    roomHint: 'ناڤێ ژوورێ',
    textHint: 'ل ڤێرە بنڤیسە',
    addPhoto: 'وێنەیەکی زێدە بکە',
    addVideo: 'ڤیدیۆیەکێ زێدە بکە',
    mapTitle: 'خانی',
    editorNote: 'خانی ژوور ب ژوور تژی بکە: ناڤێ وێ، وێنێن وێ و نامەیێن چەکمەجێن وێ.',
    drawersTitle: 'نامەیێن چەکمەجان',
    photosHint: 'وێنە ل سەر دیوارێ پشتێ هاتینە هەلاویستن، ژ چەپێ بۆ راستێ.',
    floorGround: 'قاتێ خوارێ',
    floorUpper: 'قاتێ سەرێ',
    notInPackage: 'نە د پاکێجا تە دایە',
  },
};

const FRIENDS: Record<Locale, Partial<Copy>> = {
  ar: { happyBirthday: 'إلى صديقي العزيز', welcome: 'بيت صغير مليء بذكرياتنا معاً' },
  en: { happyBirthday: 'For my bestie', welcome: 'A little house full of our memories' },
  ckb: { happyBirthday: 'بۆ هاوڕێ ئازیزەکەم', welcome: 'خانوویەکی بچووکی پڕ لە یادەوەرییەکانمان' },
  bdn: { happyBirthday: 'بۆ هەڤالێ من یێ شرین', welcome: 'خانیەکێ بچووک تژی بیرهاتنێن مە' },
};

export function copyFor(locale: string, occasion: string | null): Copy {
  const l = (['ar', 'en', 'ckb', 'bdn'] as const).includes(locale as Locale) ? (locale as Locale) : 'ar';
  return occasion === 'friends' ? { ...BIRTHDAY[l], ...FRIENDS[l] } : BIRTHDAY[l];
}

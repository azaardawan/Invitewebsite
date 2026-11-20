import type { InvitationLocale } from '@/theme-sdk';

/** The printed pieces' fixed lines (the wedding poster and the Hewlêr postcard). Kurdish auto-approved. */
export const WORDS = {
  en: {
    together: 'Together with our families',
    inviteWedding: 'invite you to celebrate the beginning of our forever.',
    inviteEngagement: 'invite you to celebrate our engagement.',
    city: 'Erbil · Kurdistan',
    footer: 'Where our roots run deep & our story begins',
    postcard: 'Postcard',
    from: 'From Hewlêr, with love',
    stamp: 'Hewlêr',
    stampSub: 'Kurdistan',
    landmarks: 'The Citadel · Shar Square · Choli Minaret',
    mapCredit: 'Map data © OpenStreetMap contributors',
  },
  ar: {
    together: 'مع عائلتينا',
    inviteWedding: 'ندعوكم لتشاركونا بداية حكايتنا إلى الأبد.',
    inviteEngagement: 'ندعوكم لتشاركونا فرحة خطوبتنا.',
    city: 'أربيل · كردستان',
    footer: 'حيث جذورنا عميقة، وحيث تبدأ حكايتنا',
    postcard: 'بطاقة بريدية',
    from: 'من هەولێر، مع الحب',
    stamp: 'هەولێر',
    stampSub: 'كردستان',
    landmarks: 'القلعة · ساحة شار · منارة الجولي',
    mapCredit: 'بيانات الخريطة © OpenStreetMap contributors',
  },
  ckb: {
    together: 'لەگەڵ هەردوو خێزانەکەمان',
    inviteWedding: 'بانگهێشتتان دەکەین بۆ ئاهەنگی سەرەتای هەمیشەییمان.',
    inviteEngagement: 'بانگهێشتتان دەکەین بۆ ئاهەنگی دەستگیرانیمان.',
    city: 'هەولێر · کوردستان',
    footer: 'لەو شوێنەی ڕەگمان قووڵە و چیرۆکەکەمان دەست پێدەکات',
    postcard: 'کارتی پۆستی',
    from: 'لە هەولێرەوە، بە خۆشەویستییەوە',
    stamp: 'هەولێر',
    stampSub: 'کوردستان',
    landmarks: 'قەڵا · گۆڕەپانی شار · منارەی چۆلی',
    mapCredit: 'داتای نەخشە © OpenStreetMap contributors',
  },
  bdn: {
    together: 'دگەل هەردوو مالباتێن مە',
    inviteWedding: 'مە هوین داخوازکرین بۆ ئاهەنگا دەستپێکا هەروهەریا مە.',
    inviteEngagement: 'مە هوین داخوازکرین بۆ ئاهەنگا دەستگیرانیا مە.',
    city: 'هەولێر · کوردستان',
    footer: 'ل وی جهێ ڕەهێن مە کویرن و چیرۆکا مە دەستپێدکەت',
    postcard: 'کارتا پۆستێ',
    from: 'ژ هەولێرێ، ب ڤیان',
    stamp: 'هەولێر',
    stampSub: 'کوردستان',
    landmarks: 'کەلها · گۆڕەپانا شار · منارا چۆلی',
    mapCredit: 'داتایێن نەخشێ © OpenStreetMap contributors',
  },
} satisfies Record<InvitationLocale, Record<string, string>>;

export type Words = (typeof WORDS)['en'];
export const wordsFor = (locale: InvitationLocale): Words => WORDS[locale];

/** "Name & Name" pieces, leaving out an empty one. */
export const namesOf = (fields: Readonly<Partial<Record<string, string>>>) =>
  [fields.person_1_name?.trim(), fields.person_2_name?.trim()].filter((n): n is string => Boolean(n));

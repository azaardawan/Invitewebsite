import type { FieldKey } from '@/catalog/fields';
import type { KeepsakeMessage } from '@/theme-sdk/print';

/**
 * Sample content for theme design review (docs/THEME_GUIDE.md Step 4):
 * a short and a long version, in Arabic and English. The long version uses
 * the maximum lengths (200-character message, 80-character venue).
 */
type Sample = Record<'short' | 'long', Partial<Record<FieldKey, string>>>;

const shared = { event_date: '2026-12-17', event_time: '19:30', venue_map_url: 'https://maps.google.com/?q=33.3152,44.3661' };

export const SAMPLES: Record<'ar' | 'en', Sample> = {
  ar: {
    short: {
      ...shared,
      person_1_name: 'نور',
      person_2_name: 'علي',
      venue_name: 'قاعة الزيتون، بغداد',
      invitation_message: 'يسرّنا دعوتكم لمشاركتنا فرحة زفافنا، وحضوركم يتمّ سعادتنا.',
    },
    long: {
      ...shared,
      person_1_name: 'فاطمة الزهراء',
      person_2_name: 'عبد الرحمن',
      venue_name: 'قاعة قصر الزيتون الكبرى للاحتفالات والمناسبات، شارع الأميرات، حي المنصور، بغداد',
      invitation_message:
        'بقلوب يملؤها الفرح والامتنان، ندعوكم لمشاركتنا فرحة عقد قراننا وحفل زفافنا، سائلين الله أن يبارك لنا ويجمع بيننا على خير، فحضوركم شرف لنا وتمام لسعادتنا في هذا اليوم المبارك. دمتم بخير وفي محبة دائمة.',
    },
  },
  en: {
    short: {
      ...shared,
      person_1_name: 'Noor',
      person_2_name: 'Ali',
      venue_name: 'Al-Zaytoun Hall, Baghdad',
      invitation_message: 'We are delighted to invite you to celebrate our wedding with us.',
    },
    long: {
      ...shared,
      person_1_name: 'Fatima Al-Zahraa',
      person_2_name: 'Abdulrahman',
      venue_name: 'Al-Zaytoun Grand Palace Hall for Weddings and Celebrations, Al-Mansour, Baghdad',
      invitation_message:
        'With hearts full of joy and gratitude, we invite you to share the blessing of our marriage. Your presence and prayers will make this day complete; we look forward to celebrating with you, God willing.',
    },
  },
};

const arMessages = [
  'ألف مبروك! بارك الله لكما وبارك عليكما وجمع بينكما في خير.',
  'نتمنى لكما حياة مليئة بالمودة والرحمة والسعادة الدائمة.',
  'فرحتكما فرحتنا، أسأل الله أن يديم عليكما المحبة ويرزقكما الذرية الصالحة.',
];
const enMessages = [
  'Congratulations! May Allah bless you both and unite you in goodness.',
  'Wishing you a lifetime of love, mercy and happiness together.',
  'Your joy is ours. May your home always be full of warmth and light.',
];
const guestNames = { ar: ['أم أحمد', 'خالد الجبوري', 'سارة', 'عائلة الحسني'], en: ['Umm Ahmed', 'Khalid Al-Jubouri', 'Sara', 'The Al-Hasani family'] };

/** `count` keepsake messages; every seventh one is a full 500-character message. */
export function sampleMessages(locale: 'ar' | 'en', count: number): KeepsakeMessage[] {
  const base = locale === 'ar' ? arMessages : enMessages;
  const names = guestNames[locale];
  const long = (locale === 'ar'
    ? 'أعزّائي، لا تسعني الكلمات لأعبّر عن سعادتي بهذا اليوم الجميل. عرفتكما منذ سنوات طويلة، ورأيت كيف جمعكما الاحترام والصدق والمودة. أسأل الله أن يجعل بيتكما سكنًا ورحمة، وأن يملأ أيامكما بالطمأنينة والبركة، وأن تبقى ضحكاتكما عامرة في كل ركن من أركانه. تذكّرا دائمًا أن الحب الحقيقي صبرٌ وتفاهم وكلمة طيبة في الوقت المناسب. أتمنى لكما رحلة عمر مليئة بالخير، وأن تكون هذه الليلة بداية لأجمل الحكايات. مع كل الحب والدعاء، ومبارك لكما من القلب، ولعائلتيكما الكريمتين أجمل التهاني. '
    : 'Dear both, words can hardly express how happy I am for you today. I have known you for many years and have watched respect, honesty and kindness bring you together. May Allah make your home a place of tranquillity and mercy, fill your days with peace and blessing, and keep your laughter echoing in every corner. Remember that true love is patience, understanding and a kind word at the right moment. I wish you a lifetime journey full of goodness, and may tonight be the start of your most beautiful story. With all my love and prayers. '
  ).repeat(2).slice(0, 500);
  return Array.from({ length: count }, (_, i) => ({
    guestName: `${names[i % names.length]}${count > names.length ? ` ${i + 1}` : ''}`,
    message: i % 7 === 6 ? long : base[i % base.length]!,
  }));
}

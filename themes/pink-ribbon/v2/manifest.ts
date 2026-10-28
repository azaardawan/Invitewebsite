import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Pink Ribbon: a birthday surprise for someone else, on cream paper inside pink ribbon bows, drawn in cherry red.
 * Closed, a party popper waits; tapped, it bursts (confetti, ribbons and stars) while the cake, the «Birthday»
 * calligraphy and the lettering appear: «a little surprise», their name and their birthday. Then a greeting, a
 * birthday candle to blow out with a wish, a letter with the customer's own message, and a closing. From the
 * designer's «Pink Ribbon — Birthday Surprise» package (its motion engine is motion.ts).
 */
const allFields = ['person_1_name', 'event_date', 'invitation_message'] as const;

export default defineTheme({
  key: 'pink-ribbon',
  version: 2,
  title: { ar: 'الشريطة الوردية', en: 'Pink Ribbon', ckb: 'پاپیۆنی پەمەیی', bdn: 'پاپیۆنا پەمبەیی' },
  experience: 'INVITATION',
  sections: ['birthday'],
  fields: [...allFields],
  features: ['music', 'photos'],
  validStates: [
    // The surprise on its own: name, birthday and message.
    { features: [], fields: [...allFields] },
    // With the design's music.
    { features: ['music'], fields: [...allFields] },
    // With music and their photos as polaroids (v2).
    { features: ['music', 'photos'], fields: [...allFields] },
  ],
  // The customer's photos (feature `photos`, v2): up to three polaroids of them, under the letter.
  photos: {
    max: 3,
    aspect: 0.8,
    labels: [
      { ar: 'الصورة الأولى', en: 'First photo', ckb: 'وێنەی یەکەم', bdn: 'وێنێ ئێکێ' },
      { ar: 'الصورة الثانية', en: 'Second photo', ckb: 'وێنەی دووەم', bdn: 'وێنێ دوویێ' },
      { ar: 'الصورة الثالثة', en: 'Third photo', ckb: 'وێنەی سێیەم', bdn: 'وێنێ سێیێ' },
    ],
  },
});

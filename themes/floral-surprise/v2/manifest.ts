import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Floral Surprise: a birthday surprise for someone else, in copper ink on cream paper. Closed, a pink bow seal waits;
 * tapped, their name and the «Birthday» calligraphy write themselves, then the hand-drawn floral cake blooms open
 * with flickering candles, drifting petals and ribbons. Then a greeting, a birthday candle to blow out with a wish,
 * a letter with the customer's own message, and a closing. From the designer's «A Little Birthday Surprise» package
 * (its motion engine is motion.ts).
 */
const allFields = ['person_1_name', 'event_date', 'invitation_message'] as const;

export default defineTheme({
  key: 'floral-surprise',
  version: 2,
  title: { ar: 'مفاجأة الزهور', en: 'Floral Surprise', ckb: 'سوپرایزی گوڵ', bdn: 'سوپرایزا گولان' },
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

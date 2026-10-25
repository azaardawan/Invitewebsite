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
  version: 1,
  title: { ar: 'الشريطة الوردية', en: 'Pink Ribbon', ckb: 'پاپیۆنی پەمەیی', bdn: 'پاپیۆنا پەمبەیی' },
  experience: 'INVITATION',
  sections: ['birthday'],
  fields: [...allFields],
  features: ['music'],
  validStates: [
    // The surprise on its own: name, birthday and message.
    { features: [], fields: [...allFields] },
    // With the design's music.
    { features: ['music'], fields: [...allFields] },
  ],
});

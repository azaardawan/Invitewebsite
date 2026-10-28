import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Cherry Confetti: a birthday surprise for someone else, on deep cherry with ivory line art. Closed, a party popper
 * waits inside a ribbon frame; tapped, it bursts (confetti, ribbons and stars) while the cake settles in and the
 * lettering appears: «a little surprise for», their name, «Happy Birthday» and their birthday. Then a greeting, a
 * birthday candle to blow out with a wish, a letter with the customer's own message, and a closing. From the
 * designer's «Cherry Confetti — Birthday Surprise» package (its motion engine is motion.ts).
 */
const allFields = ['person_1_name', 'event_date', 'invitation_message'] as const;

export default defineTheme({
  key: 'cherry-confetti',
  version: 2,
  title: { ar: 'كونفيتي الكرز', en: 'Cherry Confetti', ckb: 'کۆنفێتی گێلاس', bdn: 'کۆنفێتی گێلاسێ' },
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

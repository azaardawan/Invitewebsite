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
  version: 1,
  title: { ar: 'كونفيتي الكرز', en: 'Cherry Confetti', ckb: 'کۆنفێتی گێلاس', bdn: 'کۆنفێتی گێلاسێ' },
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

import { defineTheme } from '@/theme-sdk/manifest';
import { ARCH_OUTLINE, HEART_OUTLINE } from './outlines';

/**
 * Winter Flower: blue roses, white anemones and eucalyptus from the source invitation. The two flower stems stand
 * joined in the middle of a white page between slate-blue double rules; a tap parts them, up-left and down-right,
 * and the names, message and date appear between them. Then the ice-blue countdown cartouche, the arched details
 * card, the reply card and an arched closing panel. Design hand-off: docs/themes/winter-flower/.
 * v2: each family on its own, the engagement wording, and the heart and arch printed cards.
 */
const allFields = [
  'person_1_name',
  'person_2_name',
  'person_1_family',
  'person_2_family',
  'event_date',
  'event_time',
  'venue_name',
  'venue_map_url',
  'invitation_message',
] as const;

export default defineTheme({
  key: 'winter-flower',
  version: 2,
  title: { ar: 'زهرة الشتاء', en: 'Winter Flower', ckb: 'گوڵی زستان', bdn: 'گولا زڤستانێ' },
  experience: 'INVITATION',
  sections: ['wedding', 'engagement'],
  fields: [...allFields],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_heart', 'card_arch'],
  // The designer's Normal / VIP / VVIP packages; the owner builds the real ones in Admin from any combination.
  validStates: [
    // Normal: the invitation with its music, countdown and the printed card; no guest form.
    {
      features: ['music', 'countdown', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'person_1_family', 'person_2_family', 'event_date', 'event_time', 'venue_name', 'invitation_message'],
    },
    // VIP: + the map button and the guest form (attending / not attending).
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'print_card'],
      fields: [...allFields],
    },
    // VVIP: + messages to the couple, the keepsake PDF and the shaped printed cards.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_heart', 'card_arch'],
      fields: [...allFields],
    },
  ],
  print: {
    // Slate blue on the white card, transparent background.
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#334c63', light: '#00000000' } },
    keepsake: { size: 'A4' },
    // The shaped cards (outlines.ts): a heart and a tall arch framed in the winter flowers.
    shapes: [
      { key: 'heart', label: { ar: 'قلب', en: 'Heart', ckb: 'دڵ', bdn: 'دل' }, widthMm: 150, heightMm: 140, outline: HEART_OUTLINE },
      { key: 'arch', label: { ar: 'قوس', en: 'Arch' }, widthMm: 110, heightMm: 170, outline: ARCH_OUTLINE },
    ],
  },
});

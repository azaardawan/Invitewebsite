import { defineTheme } from '@/theme-sdk/manifest';
import { FRAMES } from './print/frames';

/**
 * Winter Flower: blue roses, white anemones and eucalyptus from the source invitation. The two flower stems stand
 * joined in the middle of a white page between slate-blue double rules; a tap parts them, up-left and down-right,
 * and the names, message and date appear between them. Then the ice-blue countdown cartouche, the arched details
 * card, the reply card and an arched closing panel. Design hand-off: docs/themes/winter-flower/.
 * v2: each family on its own, the engagement wording, and the owner's posters as printed frames (oval, wavy, rounded corners).
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
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_arch'],
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
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_arch'],
      fields: [...allFields],
    },
  ],
  print: {
    // Slate blue on the white card, transparent background.
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#334c63', light: '#00000000' } },
    keepsake: { size: 'A4' },
    // The owner's posters as printed frames (print/frames.ts): an oval, a wavy frame and rounded corners, in the winter flowers.
    shapes: [
      { key: 'arch-oval', label: { ar: 'بيضاوي', en: 'Oval' }, widthMm: FRAMES['arch-oval'].widthMm, heightMm: FRAMES['arch-oval'].heightMm, outline: FRAMES['arch-oval'].outline },
      { key: 'arch-wavy', label: { ar: 'إطار متموّج', en: 'Wavy frame' }, widthMm: FRAMES['arch-wavy'].widthMm, heightMm: FRAMES['arch-wavy'].heightMm, outline: FRAMES['arch-wavy'].outline },
      { key: 'arch-corners', label: { ar: 'إطار بزوايا مقوّسة', en: 'Rounded corners' }, widthMm: FRAMES['arch-corners'].widthMm, heightMm: FRAMES['arch-corners'].heightMm, outline: FRAMES['arch-corners'].outline },
    ],
  },
});

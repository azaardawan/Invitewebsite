import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Winter Flower: blue roses, white anemones and eucalyptus from the source invitation. The two flower stems stand
 * joined in the middle of a white page between slate-blue double rules; a tap parts them, up-left and down-right,
 * and the names, message and date appear between them. Then the ice-blue countdown cartouche, the arched details
 * card, the reply card and an arched closing panel. Design hand-off: docs/themes/winter-flower/.
 */
const allFields = [
  'person_1_name',
  'person_2_name',
  'family_names',
  'event_date',
  'event_time',
  'venue_name',
  'venue_map_url',
  'invitation_message',
] as const;

export default defineTheme({
  key: 'winter-flower',
  version: 1,
  title: { ar: 'زهرة الشتاء', en: 'Winter Flower' },
  experience: 'INVITATION',
  sections: ['wedding'],
  fields: [...allFields],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card'],
  // The designer's Normal / VIP / VVIP packages; the owner builds the real ones in Admin from any combination.
  validStates: [
    // Normal: the invitation with its music, countdown and the printed card; no guest form.
    {
      features: ['music', 'countdown', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'family_names', 'event_date', 'event_time', 'venue_name', 'invitation_message'],
    },
    // VIP: + the map button and the guest form (attending / not attending).
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'print_card'],
      fields: [...allFields],
    },
    // VVIP: + messages to the couple and the keepsake PDF.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card'],
      fields: [...allFields],
    },
  ],
  print: {
    // Slate blue on the white card, transparent background.
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#334c63', light: '#00000000' } },
    keepsake: { size: 'A4' },
  },
});

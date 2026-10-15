import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Burgundy & Lace: an ivory envelope sealed with a burgundy rose wax seal on a wine ground framed in lace
 * corners; the flap opens and a lace card rises with the couple's names. Then ivory stationery, a countdown over
 * a painting, a calendar card, the reply card and the guest messages. Design hand-off: docs/themes/burgundy-lace/.
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
  key: 'burgundy-lace',
  version: 1,
  title: { ar: 'العنابي والدانتيل', en: 'Burgundy & Lace' },
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
    // Wine on an ivory square, as in the design's QR box on the card.
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#49110e', light: '#f7f4e7' } },
    keepsake: { size: 'A4' },
  },
});

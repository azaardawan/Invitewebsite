import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Espresso & Ivory: an espresso envelope with ivory flowers, sealed with a gold botanical wax seal; the flap opens
 * and an ivory card rises with the couple's names. Then espresso pages with ivory flowers, an ivory countdown, an
 * arched calendar card, the reply card and the guest messages, with lines that write themselves in as you scroll.
 * Design hand-off: docs/themes/espresso-ivory/.
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
  key: 'espresso-ivory',
  version: 1,
  title: { ar: 'الإسبريسو والعاجي', en: 'Espresso & Ivory' },
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
    // Espresso on an ivory square, as in the design's QR box on the card.
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#2b1b16', light: '#f4ecdf' } },
    keepsake: { size: 'A4' },
  },
});

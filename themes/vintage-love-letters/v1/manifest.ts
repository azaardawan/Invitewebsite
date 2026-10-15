import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Vintage Love Letters (poster edition): the source poster (lined letter paper, lace, a red rose, striped tulips,
 * the burgundy "Wedding Invitation" title and two red name strips) with a sealed envelope. The tap brings the
 * envelope forward, opens the flap and draws out a letter with the couple's names; then a letter-style website.
 * Design hand-off: docs/themes/vintage-love-letters/.
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
  key: 'vintage-love-letters',
  version: 1,
  title: { ar: 'رسائل الحب العتيقة', en: 'Vintage Love Letters' },
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
    // Deep wine on the cream poster paper (transparent background).
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#49170f', light: '#00000000' } },
    keepsake: { size: 'A4' },
  },
});

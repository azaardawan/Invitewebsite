import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Olive Ring Box — a velvet ring box opens into a warm beige, sparsely
 * botanical Muslim wedding invitation. Design brief and hand-off:
 * docs/themes/olive-ring-box/brief.md.
 */
const allFields = [
  'person_1_name',
  'person_2_name',
  'event_date',
  'event_time',
  'venue_name',
  'venue_map_url',
  'invitation_message',
] as const;

export default defineTheme({
  key: 'olive-ring-box',
  version: 1,
  title: { ar: 'علبة الخاتم الزيتونية', en: 'Olive Ring Box' },
  experience: 'INVITATION',
  sections: ['wedding'],
  fields: [...allFields],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card'],
  validStates: [
    // Normal: opening, music, names, message, date, time, venue, printable card.
    {
      features: ['music', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'invitation_message'],
    },
    // VIP: + countdown, map button, guest name with attending / not attending.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'print_card'],
      fields: [...allFields],
    },
    // VVIP (complete theme): + message to the couple and the keepsake PDF.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card'],
      fields: [...allFields],
    },
  ],
  print: { card: { size: 'A5', bleedMm: 3, qr: true }, keepsake: { size: 'A4' } },
});

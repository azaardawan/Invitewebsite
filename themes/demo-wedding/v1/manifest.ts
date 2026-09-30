import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Internal demo theme used for development and automated tests.
 * `internal: true` means it can never be activated for sale.
 */
export default defineTheme({
  key: 'demo-wedding',
  version: 1,
  title: { ar: 'تصميم تجريبي', en: 'Demo theme' },
  experience: 'INVITATION',
  sections: ['wedding'],
  fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'venue_map_url', 'invitation_message'],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card'],
  validStates: [
    // Normal
    {
      features: ['music', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name'],
    },
    // VIP
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'venue_map_url'],
    },
    // VVIP = complete theme
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'venue_map_url', 'invitation_message'],
    },
  ],
  print: { card: { size: 'A5', bleedMm: 3, qr: true }, keepsake: { size: 'A4' } },
  internal: true,
});

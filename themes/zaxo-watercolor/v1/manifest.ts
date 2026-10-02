import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Zaxo Watercolor: an illustrated Kurdish-heritage wedding invitation.
 * A painted cover with a diamond seal opens (1.4 s) onto the names above a
 * watercolor montage of Zaxo landmarks, the date and venue, and an optional
 * couple scene revealed on scroll. Designed states follow the hand-off brief.
 */
export default defineTheme({
  key: 'zaxo-watercolor',
  version: 1,
  title: { ar: 'زاخو بالألوان المائية', en: 'Zaxo Watercolor' },
  experience: 'INVITATION',
  sections: ['wedding'],
  fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'venue_map_url', 'invitation_message'],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card'],
  validStates: [
    // Normal: opening, names, date/time/venue, message; ends with an ornament.
    {
      features: ['music', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'invitation_message'],
    },
    // VIP: adds countdown, map and the attendance form.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'venue_map_url', 'invitation_message'],
    },
    // VVIP = complete theme: guest message in the same form, keepsake PDF.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'venue_map_url', 'invitation_message'],
    },
  ],
  print: { card: { size: 'A5', bleedMm: 3, qr: true }, keepsake: { size: 'A4' } },
});

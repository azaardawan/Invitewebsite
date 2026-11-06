import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Delal Bridge: a Zakho wedding and engagement invitation. The cover is Delal Bridge over the Khabur under a blue sky
 * with the couple's names. Opening (3.3 s): the camera flies to the bridge and through its arch, pomegranate trees close
 * in, a fall of leaves covers the screen and falls away onto a Kurdish kilim gateway holding the invitation card. Then
 * the website: the verse, the celebration card, the countdown, the reply (attendance and a message in one form), the
 * guests' messages and the couple's thanks. Built from the owner's layers (Zakho asset kit, 2026-11).
 */
const allFields = ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'venue_map_url', 'invitation_message'] as const;

export default defineTheme({
  key: 'delal-bridge',
  version: 1,
  title: {
    ar: 'جسر دلال',
    en: 'Delal Bridge',
    ckb: 'پردی دەلال',
    bdn: 'پرا دەلال',
  },
  experience: 'INVITATION',
  sections: ['wedding', 'engagement'],
  fields: [...allFields],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card'],
  // Example packages; the owner builds the real ones in Admin from any combination.
  validStates: [
    // Normal: the opening, names, verse, the celebration card and the thanks.
    {
      features: ['music', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'invitation_message'],
    },
    // VIP: + countdown, map and the attendance form.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'print_card'],
      fields: [...allFields],
    },
    // VVIP = complete: + a message in the same form, the guests' messages and the keepsake PDF.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card'],
      fields: [...allFields],
    },
  ],
  print: {
    card: {
      size: 'A5',
      bleedMm: 3,
      qr: true,
      qrColors: { dark: '#5a1f1b', light: '#00000000' },
    },
    keepsake: { size: 'A4' },
  },
});

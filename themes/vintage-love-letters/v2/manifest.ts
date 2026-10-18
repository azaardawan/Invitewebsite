import { defineTheme } from '@/theme-sdk/manifest';
import { FRAMES } from './print/frames';

/**
 * Vintage Love Letters (poster edition): the source poster (lined letter paper, lace, a red rose, striped tulips,
 * the burgundy "Wedding Invitation" title and two red name strips) with a sealed envelope. The tap brings the
 * envelope forward, opens the flap and draws out a letter with the couple's names; then a letter-style website.
 * Design hand-off: docs/themes/vintage-love-letters/.
 * v2: each family on its own, the engagement wording, and the owner's poster as a printed frame.
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
  key: 'vintage-love-letters',
  version: 2,
  title: { ar: 'رسائل الحب العتيقة', en: 'Vintage Love Letters', ckb: 'نامە کۆنەکانی خۆشەویستی', bdn: 'نامێن کەڤن یێن ڤیانێ' },
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
    // Deep wine on the cream poster paper (transparent background).
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#49170f', light: '#00000000' } },
    keepsake: { size: 'A4' },
    // The owner's poster as a printed frame (print/frames.ts): the wavy letter paper with the poster's title and red strips.
    shapes: [
      { key: 'arch', label: { ar: 'إطار البطاقة', en: 'Card frame', ckb: 'چوارچێوەی کارت', bdn: 'چوارچۆڤا کارتێ' }, widthMm: FRAMES['arch'].widthMm, heightMm: FRAMES['arch'].heightMm, outline: FRAMES['arch'].outline },
    ],
  },
});

import { defineTheme } from '@/theme-sdk/manifest';
import { ARCH_OUTLINE } from './outlines';

/**
 * Laurel & Bloom: a graduation invitation on soft grey paper in deep green. A gatefold poster with engraved botanical
 * corners and ivory roses opens onto an arched inside page with the cap, the graduate's name and degree; the website
 * unfolds below it (portrait arch, countdown, the day, the reply card and the guest messages). Design hand-off:
 * docs/themes/laurel-bloom/. The graduate's portrait (feature `photos`) fills the portrait arch; without it the arch holds the year and the cap.
 */
const allFields = [
  'person_1_name',
  'achievement',
  'class_year',
  'event_date',
  'event_time',
  'venue_name',
  'venue_map_url',
  'invitation_message',
] as const;

export default defineTheme({
  key: 'laurel-bloom',
  version: 1,
  title: { ar: 'الغار والزهر', en: 'Laurel & Bloom', ckb: 'گەڵای غار و گوڵ', bdn: 'بەلگێن غارێ و گول' },
  experience: 'INVITATION',
  sections: ['graduation'],
  fields: [...allFields],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_arch', 'photos'],
  // The designer's Normal / VIP / VVIP packages; the owner builds the real ones in Admin from any combination.
  validStates: [
    // Normal: the invitation with its music, countdown and the printed card; no guest form.
    {
      features: ['music', 'countdown', 'print_card'],
      fields: ['person_1_name', 'achievement', 'class_year', 'event_date', 'event_time', 'venue_name', 'invitation_message'],
    },
    // VIP: + the map button and the guest form (attending / not attending).
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'print_card'],
      fields: [...allFields],
    },
    // VVIP: + messages to the graduate, the keepsake PDF and the arched printed card.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_arch', 'photos'],
      fields: [...allFields],
    },
  ],
  // The customer's photos (feature `photos`): the graduation portrait in the arch, and a second moment as a tilted print.
  photos: {
    max: 2,
    aspect: 0.8,
    frames: [{ aspect: 0.8 }, { aspect: 4 / 3 }],
    labels: [
      { ar: 'صورة التخرّج', en: 'Graduation portrait', ckb: 'وێنەی دەرچوون', bdn: 'وێنێ دەرچوونێ' },
      { ar: 'لحظة من الرحلة', en: 'A moment from the journey', ckb: 'ساتێک لە گەشتەکە', bdn: 'دەمەک ژ گەشتێ' },
    ],
  },
  print: {
    // Deep green on the grey paper (transparent background).
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#20443b', light: '#00000000' } },
    keepsake: { size: 'A4' },
    // The arch of the inside page as a card of its own (outlines.ts).
    shapes: [{ key: 'arch', label: { ar: 'قوس', en: 'Arch' }, widthMm: 110, heightMm: 170, outline: ARCH_OUTLINE }],
  },
});

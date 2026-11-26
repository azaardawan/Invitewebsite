import { defineTheme } from '@/theme-sdk/manifest';
import { ARCH_OUTLINE } from './outlines';

/**
 * Erbil · Hewlêr: a wedding and engagement invitation through the streets of Erbil, in watercolour (the designer's
 * Erbil package, 2026-11-14). The cover is the citadel gate under a blue sky with the couple's names. v2 (owner,
 * 2026-11-15): after Open the guest scrolls through the journey as the designer made it, at the designer's pace (the
 * layers move with the scroll; scrolling back plays it backwards): through the gate, past the Citadel, through Shar
 * Square and the Choli Minaret, onto the arched card. Then the website: the welcome, the city atlas on the real street
 * map (OpenStreetMap), the countdown, the day and the place, the Hewlêr postcard, up to three photos in the gate's
 * pointed arches, the reply, the guests' wishes and the farewell over tea.
 * Printed: the A5 card is the designer's wedding poster (front) and the Hewlêr postcard with the customer's words
 * (back); the arch card is the poster cut to its pointed arch.
 */
const allFields = ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'venue_map_url', 'invitation_message'] as const;

export default defineTheme({
  key: 'erbil-hewler',
  version: 3,
  title: {
    ar: 'هەولێر',
    en: 'Erbil · Hewlêr',
    ckb: 'هەولێر',
    bdn: 'هەولێر',
  },
  experience: 'INVITATION',
  sections: ['wedding', 'engagement'],
  fields: [...allFields],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'photos', 'print_card', 'card_arch'],
  // Example packages; the owner builds the real ones in Admin from any combination.
  validStates: [
    // Normal: the journey, the card, the city, the day and the place.
    {
      features: ['music', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'invitation_message'],
    },
    // VIP: + countdown, map and the reply.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'print_card'],
      fields: [...allFields],
    },
    // VVIP: + the guests' wishes, the couple's photo and the arch card.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'photos', 'print_card', 'card_arch'],
      fields: [...allFields],
    },
  ],
  sample: { locale: 'ckb', names: 'kurdish' },
  // Up to three photos in the gate's pointed arches (the arcade): the main one in the tall middle arch.
  photos: {
    max: 3,
    aspect: 0.72,
    labels: [
      {
        ar: 'الصورة الرئيسية (القوس الأوسط)',
        en: 'The main photo (the middle arch)',
        ckb: 'وێنە سەرەکییەکە (کەوانەی ناوەڕاست)',
        bdn: 'وێنێ سەرەکی (کەڤانا ناڤەڕاستێ)',
      },
      { ar: 'الصورة الثانية', en: 'The second photo', ckb: 'وێنەی دووەم', bdn: 'وێنێ دووێ' },
      { ar: 'الصورة الثالثة', en: 'The third photo', ckb: 'وێنەی سێیەم', bdn: 'وێنێ سێیێ' },
    ],
  },
  print: {
    card: {
      size: 'A5',
      bleedMm: 3,
      qr: true,
      qrColors: { dark: '#2b575b', light: '#00000000' },
    },
    shapes: [
      {
        key: 'arch',
        label: { ar: 'قوس', en: 'Arch', ckb: 'کەوانە', bdn: 'کەڤان' },
        widthMm: 120,
        heightMm: 180,
        outline: ARCH_OUTLINE,
      },
    ],
  },
});

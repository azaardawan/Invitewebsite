import { defineTheme } from '@/theme-sdk/manifest';
import { CARTOUCHE_OUTLINE, CARTOUCHE_SIZE, HEART_OUTLINE } from './outlines';

/**
 * Espresso & Ivory: an espresso envelope with ivory flowers, sealed with a gold botanical wax seal; the flap opens
 * and an ivory card rises with the couple's names. Then espresso pages with ivory flowers, an ivory countdown, an
 * arched calendar card, the reply card and the guest messages, with lines that write themselves in as you scroll.
 * Design hand-off: docs/themes/espresso-ivory/.
 * v2: each family on its own, the engagement wording, and the heart and the cartouche printed cards.
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
  key: 'espresso-ivory',
  version: 2,
  title: { ar: 'الإسبريسو والعاجي', en: 'Espresso & Ivory', ckb: 'ئێسپرێسۆ و عاجی', bdn: 'ئێسپرێسۆ و عاجی' },
  experience: 'INVITATION',
  sections: ['wedding', 'engagement'],
  fields: [...allFields],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_heart', 'card_arch'],
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
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_heart', 'card_arch'],
      fields: [...allFields],
    },
  ],
  print: {
    // Espresso on an ivory square, as in the design's QR box on the card.
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#2b1b16', light: '#f4ecdf' } },
    keepsake: { size: 'A4' },
    // The shaped cards (outlines.ts): the ivory cartouche from the envelope (its own artwork, cut on its edge) and a heart.
    shapes: [
      { key: 'heart', label: { ar: 'قلب', en: 'Heart', ckb: 'دڵ', bdn: 'دل' }, widthMm: 150, heightMm: 140, outline: HEART_OUTLINE },
      { key: 'arch', label: { ar: 'إطار البطاقة', en: 'Cartouche' }, ...CARTOUCHE_SIZE, outline: CARTOUCHE_OUTLINE },
    ],
  },
});

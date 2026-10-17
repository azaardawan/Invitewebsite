import { defineTheme } from '@/theme-sdk/manifest';
import { ARCH_OUTLINE, HEART_OUTLINE } from './outlines';

/**
 * Burgundy & Lace: an ivory envelope sealed with a burgundy rose wax seal on a wine ground framed in lace
 * corners; the flap opens and a lace card rises with the couple's names. Then ivory stationery, the two families, a
 * countdown over a painting, a calendar card, the reply card and the guest messages, closing on the wax seal. Design
 * hand-off: docs/themes/burgundy-lace/.
 * v2: the couple's initials pressed into the wax seal (or the rose, if they prefer), each family on its own, the
 * engagement wording, and the heart and arch printed cards.
 */
const allFields = [
  'person_1_name',
  'person_2_name',
  'seal_initials',
  'person_1_family',
  'person_2_family',
  'event_date',
  'event_time',
  'venue_name',
  'venue_map_url',
  'invitation_message',
] as const;

export default defineTheme({
  key: 'burgundy-lace',
  version: 2,
  title: { ar: 'العنابي والدانتيل', en: 'Burgundy & Lace', ckb: 'عەنابی و دانتێلا', bdn: 'عەنابی و دانتێل' },
  experience: 'INVITATION',
  sections: ['wedding', 'engagement'],
  fields: [...allFields],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_heart', 'card_arch'],
  // The designer's Normal / VIP / VVIP packages; the owner builds the real ones in Admin from any combination.
  validStates: [
    // Normal: the invitation with its music, countdown and the printed card; no guest form.
    {
      features: ['music', 'countdown', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'seal_initials', 'person_1_family', 'person_2_family', 'event_date', 'event_time', 'venue_name', 'invitation_message'],
    },
    // VIP: + the map button and the guest form (attending / not attending).
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'print_card'],
      fields: [...allFields],
    },
    // VVIP: + messages to the couple, the keepsake PDF, and the heart and arch printed cards.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_heart', 'card_arch'],
      fields: [...allFields],
    },
  ],
  // The symbol between the two initials on the wax seal (the same choices as Royal Olive Crest's seal).
  wording: [
    {
      key: 'sealJoin',
      label: {
        ar: 'الرمز بين الحرفين على الختم',
        en: 'Symbol between the initials on the seal',
        ckb: 'هێمای نێوان دوو پیتەکە لەسەر مۆر',
        bdn: 'نیشانا د ناڤبەرا هەردوو تیپان دا ل سەر مۆرێ',
      },
      ar: '&',
      options: ['♥', '·', 'و'],
      custom: false,
      maxLength: 1,
    },
  ],
  // The wax seal: the couple's initials (default) or the design's rose.
  switches: [{ key: 'sealInitials', label: { ar: 'الأحرف الأولى من اسمينا على ختم الشمع (بدل الوردة)', en: 'Our initials on the wax seal (instead of the rose)' }, default: true }],
  print: {
    // Wine on an ivory square, as in the design's QR box on the card.
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#49110e', light: '#f7f4e7' } },
    keepsake: { size: 'A4' },
    // Cut lines drawn for this design (outlines.ts): a heart, and a tall arch like the lace card's window.
    shapes: [
      { key: 'heart', label: { ar: 'قلب', en: 'Heart', ckb: 'دڵ', bdn: 'دل' }, widthMm: 150, heightMm: 140, outline: HEART_OUTLINE },
      { key: 'arch', label: { ar: 'قوس', en: 'Arch', ckb: 'کەوانە', bdn: 'کەڤان' }, widthMm: 110, heightMm: 170, outline: ARCH_OUTLINE },
    ],
  },
});

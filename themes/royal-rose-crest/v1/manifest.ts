import { defineTheme } from '@/theme-sdk/manifest';
import { HEART_OUTLINE, LEAF_OUTLINE } from './outlines';

/**
 * Royal Rose Crest (owner, 2026-11-19): Royal Olive Crest (its v3) in baby pink and rose gold, the owner's choice B of
 * four colourings. A baby-pink envelope sealed with a rose gold wax seal bearing the couple's initials opens onto the
 * crowned crest, its shield filled with pink enamel and the initials engraved in it, then blush-cream pages framed in
 * rose gold, on the owner's damask and floral-scroll textures recoloured pink. The artwork is Royal Olive's, recoloured
 * (docs/themes/royal-rose-crest/README.md).
 */
const allFields = ['person_1_name', 'person_2_name', 'seal_initials', 'event_date', 'event_time', 'venue_name', 'venue_map_url', 'invitation_message'] as const;

export default defineTheme({
  key: 'royal-rose-crest',
  version: 1,
  title: { ar: 'الشعار الملكي الوردي', en: 'Royal Rose Crest', ckb: 'دروشمی شاهانەی پەمەیی', bdn: 'نیشانا شاهانە یا پەمبەیی' },
  experience: 'INVITATION',
  sections: ['wedding'],
  fields: [...allFields],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_leaf', 'card_heart'],
  // Example packages; the owner builds the real ones in Admin from any combination.
  validStates: [
    // A printed card and the online invitation with its music.
    {
      features: ['music', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'seal_initials', 'event_date', 'event_time', 'venue_name', 'invitation_message'],
    },
    // + countdown, map button, guest name with attending / not attending.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'print_card'],
      fields: [...allFields],
    },
    // The complete theme: + messages to the couple, the keepsake PDF, and the leaf or heart card instead of the card.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_leaf', 'card_heart'],
      fields: [...allFields],
    },
  ],
  // The symbol between the two initials on the wax seal (when the customer doesn't type the initials).
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
    // A short title above the names on the front of every printed card (A5, leaf, heart).
    {
      key: 'cardThanks',
      label: {
        ar: 'سطر الشكر على واجهة البطاقة المطبوعة',
        en: 'Thank-you line on the front of the printed card',
        ckb: 'دێڕی سوپاس لەسەر ڕووی کارتی چاپکراو',
        bdn: 'دێڕا سوپاسێ ل سەر ڕوویێ کارتا چاپکری',
      },
      ar: 'شكرًا لحضوركم حفل زفافنا',
      versions: {
        en: 'Thank you for coming to our wedding',
        ckb: 'سوپاس بۆ ئامادەبوونتان لە ئاهەنگی زەماوەندەکەمان',
        bdn: 'سوپاس بۆ ئامادەبوونا هەوە ل ئاهەنگا داوەتا مە',
      },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 60,
    },
  ],
  print: {
    // The QR code in the theme's deep rose on the cream paper (transparent background), not black on white.
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#5a2f37', light: '#00000000' } },
    keepsake: { size: 'A4' },
    // The owner's leaf (#12/#9) and heart (#14/#13) cards; sizes as agreed (about 11 × 18 cm and 15 × 16 cm).
    // The leaf's back (#9) is a landscape design: read with the card turned sideways, like the A5 card's back.
    shapes: [
      {
        key: 'leaf',
        label: { ar: 'ورقة شجر', en: 'Leaf', ckb: 'گەڵا', bdn: 'بەلگ' },
        widthMm: 107,
        heightMm: 180.6,
        outline: LEAF_OUTLINE,
        backSideways: true,
      },
      { key: 'heart', label: { ar: 'قلب', en: 'Heart', ckb: 'دڵ', bdn: 'دل' }, widthMm: 150, heightMm: 157.9, outline: HEART_OUTLINE },
    ],
  },
});

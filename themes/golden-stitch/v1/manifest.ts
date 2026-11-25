import { defineTheme } from '@/theme-sdk/manifest';
import { ARCH_HEIGHT_MM, ARCH_OUTLINE, ARCH_WIDTH_MM } from './outlines';

/**
 * Golden Stitch (owner, 2026-11-25): a gold-thread needle stitches the couple's date and a heart onto warm linen (a film
 * made for each couple by the invite renderer, renderer/), then cream pages framed in bronze, as the owner drew them:
 * the families, the Quran verse, a personal note, the wedding details, the countdown, the congratulations messages and
 * a thank-you page. Printed: an A5 card (front and back drawn upright), the owner's scalloped arch card, and the guests'
 * messages written on the owner's lined flower paper (the keepsake).
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
  key: 'golden-stitch',
  version: 1,
  title: { ar: 'الغرزة الذهبية', en: 'Golden Stitch', ckb: 'دروومانی زێڕین', bdn: 'دروومانا زێڕین' },
  experience: 'INVITATION',
  sections: ['wedding'],
  fields: [...allFields],
  // The families' names and the personal note are the design's own pages: each is left out whole when empty.
  optionalFields: ['person_1_family', 'person_2_family', 'invitation_message'],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_arch'],
  // Example packages; the owner builds the real ones in Admin from any combination.
  validStates: [
    // The film, the names and the details, with music and the printed card.
    {
      features: ['music', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name'],
    },
    // + the families, the note, the countdown, the map button and the guests' replies.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'print_card'],
      fields: [...allFields],
    },
    // The complete design: + congratulations messages, the keepsake and the arch card.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_arch'],
      fields: [...allFields],
    },
  ],
  // Owner, 2026-11-25: the couple's own film is made after payment and takes about ten minutes; say so on the order
  // form and the receipt, so nobody gives up waiting.
  pageTexts: {
    notice: {
      ar: 'بعد الدفع نصنع فيلم التطريز الخاص بكم بأسمائكم وتاريخكم، ويستغرق ذلك حوالي ١٠ دقائق. لا تقلقوا: ابقوا في الصفحة أو عودوا بعد قليل وستجدون دعوتكم جاهزة.',
      en: "After payment we make your own stitched film with your names and date. It takes about 10 minutes, so don't worry: stay on this page or come back shortly and your invitation will be ready.",
      ckb: 'دوای پارەدان فیلمی دروومانەکەتان بە ناو و بەرواری خۆتان دروست دەکەین، نزیکەی ١٠ خولەک دەخایەنێت. نیگەران مەبن: لەم پەڕەیەدا بمێننەوە یان کەمێکی تر بگەڕێنەوە و بانگهێشتنامەکەتان ئامادە دەبێت.',
      bdn: 'پشتی پارەدانێ ئەم فیلمێ دروومانا هەوە ب ناڤ و دیرۆکا هەوە چێدکەین، نێزیکی ١٠ خولەکان دڤێت. خەمێ نەخۆن: ل ڤێ پەڕێ بمینن یان پشتی کێمەکێ ڤەگەڕن و داخوازنامەیا هەوە دێ یا ئامادە بیت.',
    },
  },
  // The Quran verse page (Ar-Rum 30:21) can be left out; the verse itself is never changed.
  switches: [
    {
      key: 'showVerse',
      label: { ar: 'إظهار صفحة الآية الكريمة', en: 'Show the Quran verse page', ckb: 'پەڕەی ئایەتی پیرۆز نیشان بدە', bdn: 'پەڕا ئایەتا پیرۆز نیشان بدە' },
      default: true,
    },
  ],
  wording: [
    // The greeting above the couple's personal note.
    {
      key: 'noteGreeting',
      label: {
        ar: 'التحية فوق رسالتكم',
        en: 'Greeting above your note',
        ckb: 'سڵاو لە سەرووی نامەکەتان',
        bdn: 'سلاڤ ل سەر نامەیا هەوە',
      },
      ar: 'ضيوفنا الأعزاء،',
      versions: { en: 'Dear Our Cherished Guests,', ckb: 'میوانە خۆشەویستەکانمان،', bdn: 'مێڤانێن مە یێن خۆشتڤی،' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 40,
    },
  ],
  print: {
    // The QR code in the design's bronze on the cream paper (transparent background).
    card: { size: 'A5', bleedMm: 3, qr: true, back: 'portrait', qrColors: { dark: '#6e4a1e', light: '#00000000' } },
    keepsake: { size: 'A4' },
    shapes: [
      {
        key: 'arch',
        label: { ar: 'بطاقة القوس', en: 'Arch card', ckb: 'کارتی کەوانە', bdn: 'کارتا کەڤانی' },
        widthMm: ARCH_WIDTH_MM,
        heightMm: ARCH_HEIGHT_MM,
        outline: ARCH_OUTLINE,
      },
    ],
  },
});

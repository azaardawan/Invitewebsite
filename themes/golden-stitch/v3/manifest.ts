import { defineTheme } from '@/theme-sdk/manifest';
import { ARCH_HEIGHT_MM, ARCH_OUTLINE, ARCH_WIDTH_MM, FRAME_HEIGHT_MM, FRAME_OUTLINE, FRAME_WIDTH_MM, LANTERN_HEIGHT_MM, LANTERN_OUTLINE, LANTERN_WIDTH_MM } from './outlines';

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
  version: 3,
  title: { ar: 'الغرزة الذهبية', en: 'Golden Stitch', ckb: 'دروومانی زێڕین', bdn: 'دروومانا زێڕین' },
  experience: 'INVITATION',
  // The couple's own stitched film, made by the invite renderer after payment (props.film).
  film: true,
  // Owner, 2026-11-25: no Open button: the invitation goes straight into the film.
  opening: 'auto',
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
    // Owner, 2026-11-26: what the celebration is called wherever the design says "wedding" (the families page, the
    // details title, the cards' "The Wedding of"): the customer may write their own, e.g. engagement or henna night.
    {
      key: 'eventName',
      label: {
        ar: 'اسم المناسبة (بدل «زفاف»)',
        en: 'The occasion (instead of "wedding")',
        ckb: 'ناوی بۆنەکە (لە جیاتی «زەماوەند»)',
        bdn: 'ناڤێ بۆنێ (ل جهێ «داوەت»)',
      },
      ar: 'زفاف',
      versions: { en: 'wedding', ckb: 'زەماوەند', bdn: 'داوەت' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 24,
    },
    // The greeting above the couple's personal note.
    {
      key: 'noteGreeting',
      label: {
        ar: 'التحية فوق رسالتكم',
        en: 'Greeting above your note',
        ckb: 'سڵاو لە سەرووی نامەکەتان',
        bdn: 'سلاڤ ل سەر نامەیا هەوە',
      },
      ar: 'إلى عائلتنا وأصدقائنا الأعزّاء،',
      versions: { en: 'To our dearest family and friends,', ckb: 'بۆ خێزان و هاوڕێ ئازیزەکانمان،', bdn: 'بۆ مالباتا مە و هەڤالێن مە یێن ئازیز،' },
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
      // Owner, 2026-11-26: two more card styles in burgundy and gold, sold with the arch card (feature card_arch):
      // the customer chooses. The rectangle is an "arch-" shape only so it is sold by the same feature.
      {
        key: 'arch-frame',
        label: { ar: 'بطاقة الورد العنّابي', en: 'Burgundy floral card', ckb: 'کارتی گوڵی شەرابی', bdn: 'کارتا گولێن شەرابی' },
        widthMm: FRAME_WIDTH_MM,
        heightMm: FRAME_HEIGHT_MM,
        outline: FRAME_OUTLINE,
      },
      {
        key: 'arch-lantern',
        label: { ar: 'بطاقة القنديل', en: 'Lantern arch card', ckb: 'کارتی کەوانەی چرا', bdn: 'کارتا کەڤانا چرایێ' },
        widthMm: LANTERN_WIDTH_MM,
        heightMm: LANTERN_HEIGHT_MM,
        outline: LANTERN_OUTLINE,
      },
    ],
  },
});

import { defineTheme } from '@/theme-sdk/manifest';
import { ORDER, SON_OF } from './copy';

/**
 * Rosebird Garden v4 — «Little Rose», the owner's edit (2026-11-02): a blush-pink watercolour birth announcement for a
 * girl, with the family by the pink bassinet redrawn in watercolour, teddies, bunting, booties, a cloud and a sleepy moon (docs: the designer's
 * package). Closed, a satin ribbon ties the paper doors; tapped, it unties and they fold open on the baby's name and
 * date of birth. Then the story with the birth order, the day of birth with the days of love since, the baby's photo
 * (feature `photos`), the du'a, the guests' wishes and the guest form. The A5 card and the Instagram story, chocolate
 * stickers and bottle label are drawn in the same art (print/).
 */
const fields = ['baby_name', 'father_name', 'birth_date'] as const;

export default defineTheme({
  key: 'rosebird-garden',
  version: 4,
  title: { ar: 'طيور الحديقة الوردية — مولودة', en: 'Rosebird Garden — baby girl' },
  experience: 'INVITATION',
  sections: ['newborn'],
  fields: [...fields],
  features: ['music', 'rsvp', 'congratulations', 'photos', 'print_card'],
  validStates: [
    { features: ['print_card'], fields: [...fields] },
    { features: ['music', 'rsvp', 'congratulations', 'print_card'], fields: [...fields] },
    // The complete design: + the baby's photo in the keepsake frame.
    { features: ['music', 'rsvp', 'congratulations', 'photos', 'print_card'], fields: [...fields] },
  ],
  // One photo of the baby, in the arched keepsake frame (4:5); the section is left out without it.
  photos: { max: 1, aspect: 0.8, labels: [{ ar: 'صورة المولودة', en: "The baby's photo", ckb: 'وێنەی کۆرپەکە', bdn: 'وێنێ زاروکی' }] },
  print: { card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#69434f', light: '#00000000' } } },
  // The customer's parts of the wording, as in v2–v3.
  wording: [
    { key: 'order', label: { ar: 'ترتيب المولودة', en: 'Birth order' }, ...ORDER, maxLength: 60 },
    { key: 'sonOf', label: { ar: 'كلمة «بنت»', en: 'The word "daughter of"' }, ...SON_OF, maxLength: 12 },
  ],
  switches: [
    {
      key: 'fatherOnExtras',
      label: { ar: 'إظهار اسم الأب على ملصقات الشوكولاتة وملصق القنينة', en: "Show the father's name on the chocolate stickers and bottle label" },
      default: false,
    },
  ],
});

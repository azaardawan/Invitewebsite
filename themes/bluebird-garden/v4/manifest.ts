import { defineTheme } from '@/theme-sdk/manifest';
import { ORDER, SON_OF } from './copy';
import { SHAPES, type ShapeKey } from './shapes';

/**
 * Bluebird Garden v4 — «Little Blue», the owner's edit (2026-11-02): a powder-blue watercolour birth announcement with
 * the family by the bassinet redrawn in watercolour, teddies, bunting, booties and a toy corner (docs: the designer's
 * package). Closed, a satin ribbon ties the paper doors; tapped, it unties and they fold open on the baby's name and
 * date of birth. Then the story with the birth order, the day of birth with the days of love since, the baby's photo
 * (feature `photos`), the du'a, the guests' wishes and the guest form. The A5 card and the Instagram story, chocolate
 * stickers and bottle label are drawn in the same art (print/).
 */
const fields = ['baby_name', 'father_name', 'birth_date'] as const;

export default defineTheme({
  key: 'bluebird-garden',
  version: 4,
  title: { ar: 'طيور الحديقة — مولود', en: 'Bluebird Garden — baby boy' },
  experience: 'INVITATION',
  sections: ['newborn'],
  fields: [...fields],
  features: ['music', 'rsvp', 'congratulations', 'photos', 'print_card', 'card_arch'],
  validStates: [
    { features: ['print_card'], fields: [...fields] },
    { features: ['music', 'rsvp', 'congratulations', 'print_card'], fields: [...fields] },
    // The complete design: + the baby's photo in the keepsake frame and the printed posters.
    { features: ['music', 'rsvp', 'congratulations', 'photos', 'print_card', 'card_arch'], fields: [...fields] },
  ],
  // One photo of the baby, in the arched keepsake frame (4:5); the section is left out without it.
  photos: { max: 1, aspect: 0.8, labels: [{ ar: 'صورة المولود', en: "The baby's photo", ckb: 'وێنەی کۆرپەکە', bdn: 'وێنێ زاروکی' }] },
  print: {
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#294c60', light: '#00000000' } },
    // The printed posters (feature `card_arch`), the other designs' poster sizes: the announcement's arch, an oval, a wavy
    // frame and rounded corners (designs.tsx, print/Shape.tsx).
    shapes: (Object.keys(SHAPES) as ShapeKey[]).map((key) => ({ key, ...SHAPES[key] })),
  },
  // The customer's parts of the wording, as in v2–v3.
  wording: [
    { key: 'order', label: { ar: 'ترتيب المولود', en: 'Birth order' }, ...ORDER, maxLength: 60 },
    { key: 'sonOf', label: { ar: 'كلمة «بن»', en: 'The word "son of"' }, ...SON_OF, maxLength: 12 },
  ],
  switches: [
    {
      key: 'fatherOnExtras',
      label: { ar: 'إظهار اسم الأب على ملصقات الشوكولاتة وملصق القنينة', en: "Show the father's name on the chocolate stickers and bottle label" },
      default: false,
    },
  ],
});

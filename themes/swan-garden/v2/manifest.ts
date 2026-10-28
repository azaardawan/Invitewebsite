import { defineTheme } from '@/theme-sdk/manifest';
import { SON_OF } from './copy';

/**
 * Swan Garden (newborn girl; the owner names it in Admin): two glass swans on a pond, pink and yellow flowers
 * and bell-flower sprigs on linen, the baby's name in pink glass lettering. With
 * the A5 card (print/Card.tsx, CardBack.tsx) and the design's own Instagram story, chocolate stickers and bottle
 * label (print/Story.tsx, Sticker.tsx, Bottle.tsx).
 * Since v2 it also has an online invitation (owner, 2026-10-28): a cover of the design's own artwork that parts
 * when opened (Theme.tsx, cover.tsx), then the story composition, the date of birth, the guest form with
 * congratulations and the guests' messages; no venue, time or countdown.
 * The owner's designs are in docs/themes/swan-garden/.
 */
export default defineTheme({
  key: 'swan-garden',
  version: 2,
  title: { ar: 'بجعة الحديقة — مولودة', en: 'Swan Garden — baby girl' },
  experience: 'INVITATION',
  sections: ['newborn'],
  fields: ['baby_name', 'father_name', 'birth_date'],
  features: ['music', 'rsvp', 'congratulations', 'print_card'],
  validStates: [
    { features: ['print_card'], fields: ['baby_name', 'father_name', 'birth_date'] },
    { features: ['music', 'rsvp', 'congratulations', 'print_card'], fields: ['baby_name', 'father_name', 'birth_date'] },
  ],
  print: { card: { size: 'A5', bleedMm: 3, qr: false } },
  // The customer's part of the wording; the praise lines and the du'a never change.
  wording: [{ key: 'sonOf', label: { ar: 'كلمة «بنت»', en: 'The word "daughter of"' }, ...SON_OF, maxLength: 12 }],
  switches: [
    { key: 'fatherOnExtras', label: { ar: 'إظهار اسم الأب على ملصقات الشوكولاتة وملصق القنينة', en: "Show the father's name on the chocolate stickers and bottle label" }, default: false },
  ],
});

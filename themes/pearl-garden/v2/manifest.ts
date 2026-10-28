import { defineTheme } from '@/theme-sdk/manifest';
import { SON_OF } from './copy';

/**
 * Pearl Garden (newborn girl; the owner names it in Admin): pink embroidered flowers, pearl sprigs and
 * stitched doves on linen, the baby's name stitched in pink thread (Marhey). The girl's sister of
 * Embroidered Garden (#6), rebuilt from the owner's pieces. With the A5 card
 * (print/Card.tsx, CardBack.tsx) and the design's own Instagram story, chocolate stickers and bottle label
 * (print/Story.tsx, Sticker.tsx, Bottle.tsx).
 * Since v2 it also has an online invitation (owner, 2026-10-28): a cover of the design's own artwork that parts
 * when opened (Theme.tsx, cover.tsx), then the story composition, the date of birth, the guest form with
 * congratulations and the guests' messages; no venue, time or countdown.
 * The owner's designs are in docs/themes/pearl-garden/.
 */
export default defineTheme({
  key: 'pearl-garden',
  version: 2,
  title: { ar: 'حديقة اللؤلؤ — مولودة', en: 'Pearl Garden — baby girl' },
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

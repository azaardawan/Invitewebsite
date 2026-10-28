import { defineTheme } from '@/theme-sdk/manifest';
import { ORDER, SON_OF } from './copy';

/**
 * Rosebird Garden (newborn girl): Bluebird Garden recoloured rose, with the girl's wording. Rose watercolour
 * delphiniums, two birds and the family by the bassinet on soft paper, the baby's name in rose glass lettering
 * (Scheherazade New). With the A5 card (print/Card.tsx) and the design's own Instagram story, chocolate stickers
 * and bottle label (print/Story.tsx, Sticker.tsx, Bottle.tsx).
 * Since v3 it also has an online invitation (owner, 2026-10-28): a cover of the design's own artwork that parts
 * when opened (Theme.tsx, cover.tsx), then the story composition, the date of birth, the guest form with
 * congratulations and the guests' messages; no venue, time or countdown.
 * The owner's designs (in blue) are in docs/themes/bluebird-garden/; this design's brief is docs/themes/rosebird-garden/.
 */
export default defineTheme({
  key: 'rosebird-garden',
  version: 3,
  title: { ar: 'طيور الحديقة الوردية — مولودة', en: 'Rosebird Garden — baby girl' },
  experience: 'INVITATION',
  sections: ['newborn'],
  fields: ['baby_name', 'father_name', 'birth_date'],
  features: ['music', 'rsvp', 'congratulations', 'print_card'],
  validStates: [
    { features: ['print_card'], fields: ['baby_name', 'father_name', 'birth_date'] },
    { features: ['music', 'rsvp', 'congratulations', 'print_card'], fields: ['baby_name', 'father_name', 'birth_date'] },
  ],
  print: { card: { size: 'A5', bleedMm: 3, qr: false } },
  // The customer's parts of the wording; the praise lines and the du'a never change.
  wording: [
    { key: 'order', label: { ar: 'ترتيب المولودة', en: 'Birth order' }, ...ORDER, maxLength: 60 },
    { key: 'sonOf', label: { ar: 'كلمة «بنت»', en: 'The word "daughter of"' }, ...SON_OF, maxLength: 12 },
  ],
  switches: [
    { key: 'fatherOnExtras', label: { ar: 'إظهار اسم الأب على ملصقات الشوكولاتة وملصق القنينة', en: "Show the father's name on the chocolate stickers and bottle label" }, default: false },
  ],
});

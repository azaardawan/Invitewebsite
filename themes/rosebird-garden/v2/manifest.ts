import { defineTheme } from '@/theme-sdk/manifest';
import { ORDER, SON_OF } from './copy';

/**
 * Rosebird Garden (newborn girl): Bluebird Garden recoloured rose, with the girl's wording. Rose watercolour
 * delphiniums, two birds and the family by the bassinet on soft paper, the baby's name in rose glass lettering
 * (Scheherazade New). Files only, no
 * online invitation: the A5 card (print/Card.tsx) and the design's own Instagram story, chocolate stickers
 * and bottle label (print/Story.tsx, Sticker.tsx, Bottle.tsx). Theme.tsx shows the story, for previews.
 * The owner's designs (in blue) are in docs/themes/bluebird-garden/; this design's brief is docs/themes/rosebird-garden/.
 */
export default defineTheme({
  key: 'rosebird-garden',
  version: 2,
  title: { ar: 'طيور الحديقة الوردية — مولودة', en: 'Rosebird Garden — baby girl' },
  experience: 'INVITATION',
  sections: ['newborn'],
  fields: ['baby_name', 'father_name', 'birth_date'],
  features: ['print_card'],
  validStates: [{ features: ['print_card'], fields: ['baby_name', 'father_name', 'birth_date'] }],
  print: { card: { size: 'A5', bleedMm: 3, qr: false } },
  onlineInvitation: false,
  // The customer's parts of the wording; the praise lines and the du'a never change.
  wording: [
    { key: 'order', label: { ar: 'ترتيب المولودة', en: 'Birth order' }, ...ORDER, maxLength: 60 },
    { key: 'sonOf', label: { ar: 'كلمة «بنت»', en: 'The word "daughter of"' }, ...SON_OF, maxLength: 12 },
  ],
  switches: [
    { key: 'fatherOnExtras', label: { ar: 'إظهار اسم الأب على ملصقات الشوكولاتة وملصق القنينة', en: "Show the father's name on the chocolate stickers and bottle label" }, default: false },
  ],
});

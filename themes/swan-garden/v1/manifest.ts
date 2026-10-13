import { defineTheme } from '@/theme-sdk/manifest';
import { SON_OF } from './copy';

/**
 * Swan Garden (newborn girl; the owner names it in Admin): two glass swans on a pond, pink and yellow flowers
 * and bell-flower sprigs on linen, the baby's name in pink glass lettering. Files only, no online invitation:
 * the A5 card (print/Card.tsx, CardBack.tsx) and the design's own Instagram story, chocolate stickers and bottle
 * label (print/Story.tsx, Sticker.tsx, Bottle.tsx). Theme.tsx shows the story, for previews.
 * The owner's designs are in docs/themes/swan-garden/.
 */
export default defineTheme({
  key: 'swan-garden',
  version: 1,
  title: { ar: 'بجعة الحديقة — مولودة', en: 'Swan Garden — baby girl' },
  experience: 'INVITATION',
  sections: ['newborn'],
  fields: ['baby_name', 'father_name', 'birth_date'],
  features: ['print_card'],
  validStates: [{ features: ['print_card'], fields: ['baby_name', 'father_name', 'birth_date'] }],
  print: { card: { size: 'A5', bleedMm: 3, qr: false } },
  onlineInvitation: false,
  // The customer's part of the wording; the praise lines and the du'a never change.
  wording: [{ key: 'sonOf', label: { ar: 'كلمة «بنت»', en: 'The word "daughter of"' }, ...SON_OF, maxLength: 12 }],
  switches: [
    { key: 'fatherOnExtras', label: { ar: 'إظهار اسم الأب على ملصقات الشوكولاتة وملصق القنينة', en: "Show the father's name on the chocolate stickers and bottle label" }, default: false },
  ],
});

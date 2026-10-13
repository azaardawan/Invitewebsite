import { defineTheme } from '@/theme-sdk/manifest';
import { SON_OF } from './copy';

/**
 * Embroidered Garden (newborn boy): white embroidered flowers, sage leaves and stitched doves on cream
 * linen, the baby's name "stitched" in sage thread (Marhey). Files only, no online invitation: the A5
 * card (print/Card.tsx) and the design's own Instagram story, chocolate stickers and bottle label
 * (print/Story.tsx, Sticker.tsx, Bottle.tsx; the extras are chosen per package). Theme.tsx shows the
 * story, for previews. The owner's designs are in docs/themes/embroidered-garden/.
 */
export default defineTheme({
  key: 'embroidered-garden',
  version: 2,
  title: { ar: 'حديقة التطريز — مولود', en: 'Embroidered Garden — baby boy' },
  experience: 'INVITATION',
  sections: ['newborn'],
  fields: ['baby_name', 'father_name', 'birth_date'],
  features: ['print_card'],
  validStates: [{ features: ['print_card'], fields: ['baby_name', 'father_name', 'birth_date'] }],
  print: { card: { size: 'A5', bleedMm: 3, qr: false } },
  onlineInvitation: false,
  // Only the connector is the customer's; the verse, the du'a and the Arabic blessing never change.
  wording: [
    { key: 'sonOf', label: { ar: 'كلمة «بن»', en: 'The word "son of"' }, ...SON_OF, maxLength: 12 },
  ],
});

import { defineTheme } from '@/theme-sdk/manifest';
import { SON_OF } from './copy';

/**
 * Embroidered Garden (newborn boy): white embroidered flowers, sage leaves and stitched doves on cream
 * linen, the baby's name "stitched" in sage thread (Marhey). With the A5 card (print/Card.tsx) and the
 * design's own Instagram story, chocolate stickers and bottle label (print/Story.tsx, Sticker.tsx, Bottle.tsx;
 * the extras are chosen per package).
 * Since v3 it also has an online invitation (owner, 2026-10-28): a cover of the design's own artwork that parts
 * when opened (Theme.tsx, cover.tsx), then the story composition, the date of birth, the guest form with
 * congratulations and the guests' messages; no venue, time or countdown.
 * The owner's designs are in docs/themes/embroidered-garden/.
 */
export default defineTheme({
  key: 'embroidered-garden',
  version: 3,
  title: { ar: 'حديقة التطريز — مولود', en: 'Embroidered Garden — baby boy' },
  experience: 'INVITATION',
  sections: ['newborn'],
  fields: ['baby_name', 'father_name', 'birth_date'],
  features: ['music', 'rsvp', 'congratulations', 'print_card'],
  validStates: [
    { features: ['print_card'], fields: ['baby_name', 'father_name', 'birth_date'] },
    { features: ['music', 'rsvp', 'congratulations', 'print_card'], fields: ['baby_name', 'father_name', 'birth_date'] },
  ],
  print: { card: { size: 'A5', bleedMm: 3, qr: false } },
  // Only the connector is the customer's; the verse, the du'a and the Arabic blessing never change.
  wording: [
    { key: 'sonOf', label: { ar: 'كلمة «بن»', en: 'The word "son of"' }, ...SON_OF, maxLength: 12 },
  ],
});

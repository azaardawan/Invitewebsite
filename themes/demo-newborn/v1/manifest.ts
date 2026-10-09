import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Internal demo for the newborn occasion (development and automated tests): the baby's name, boy or girl,
 * parents, date of birth and a short quote. The story, stickers and bottle label are platform extras drawn
 * on the owner's artwork, so they are not listed here. `internal: true`: never on sale.
 */
export default defineTheme({
  key: 'demo-newborn',
  version: 1,
  title: { ar: 'تصميم مولود تجريبي', en: 'Newborn demo theme' },
  experience: 'INVITATION',
  sections: ['newborn'],
  fields: ['baby_name', 'baby_gender', 'mother_name', 'father_name', 'birth_date', 'baby_quote'],
  features: ['music', 'rsvp', 'congratulations', 'print_card'],
  validStates: [
    { features: ['print_card'], fields: ['baby_name', 'baby_gender', 'birth_date'] },
    { features: ['music', 'rsvp', 'congratulations', 'print_card'], fields: ['baby_name', 'baby_gender', 'mother_name', 'father_name', 'birth_date', 'baby_quote'] },
  ],
  // No print/Card.tsx: the platform prints a simple front with the baby's details (or the owner's artwork).
  print: { card: { size: 'A5', bleedMm: 3, qr: true } },
  internal: true,
});

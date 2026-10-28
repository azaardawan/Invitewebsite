import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Cherry Confetti Party: the customer's invitation to their own birthday party, from the designer's Cherry
 * Confetti (#19) — on deep cherry with ivory line art. Closed, a party popper waits inside a ribbon frame; tapped,
 * it bursts (confetti, ribbons and stars) while «You are invited to», their name, «Birthday Party», the day and
 * the place appear. Then the website, as Blush Floral's: the details and the map, the countdown, the cake, their
 * photos, a note from them signed in their own hand (feature `signature`: it draws itself when the guest scrolls
 * to it), the reply card with the guests' wishes, and a closing.
 */
const allFields = ['person_1_name', 'event_date', 'event_time', 'venue_name', 'venue_map_url', 'invitation_message'] as const;

export default defineTheme({
  key: 'cherry-confetti-party',
  version: 1,
  title: { ar: 'حفلة كونفيتي الكرز', en: 'Cherry Confetti Party', ckb: 'ئاهەنگی کۆنفێتی گێلاس', bdn: 'ئاهەنگا کۆنفێتی گێلاسێ' },
  experience: 'INVITATION',
  sections: ['birthday'],
  fields: [...allFields],
  // A birthday is not always held somewhere in particular: the customer may leave the place (and its map link) empty.
  optionalFields: ['venue_name', 'venue_map_url'],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'signature', 'photos', 'print_card'],
  // Example packages; the owner builds the real ones in Admin from any combination.
  validStates: [
    { features: ['countdown', 'map'], fields: [...allFields] },
    // The printed card alone (the poster on A5, the QR code on its back), without the place.
    { features: ['countdown', 'print_card'], fields: ['person_1_name', 'event_date', 'event_time', 'invitation_message'] },
    // A package without the place at all.
    { features: ['countdown'], fields: ['person_1_name', 'event_date', 'event_time', 'invitation_message'] },
    { features: ['music', 'countdown', 'map', 'rsvp', 'signature'], fields: [...allFields] },
    // The complete design: + the guests' wishes and the customer's photos.
    { features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'signature', 'photos', 'print_card'], fields: [...allFields] },
  ],
  // The printed card (feature `print_card`): the poster on A5, the customer's lines set on it; the QR code on the back.
  print: {
    // Cherry on an ivory tile (the back is deep cherry).
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#470000', light: '#fff7f2' } },
  },
  // The customer's photos (feature `photos`): two keepsake prints under the cake.
  photos: {
    max: 2,
    aspect: 0.8,
    labels: [
      { ar: 'الصورة الأولى', en: 'First photo', ckb: 'وێنەی یەکەم', bdn: 'وێنێ ئێکێ' },
      { ar: 'الصورة الثانية', en: 'Second photo', ckb: 'وێنەی دووەم', bdn: 'وێنێ دوویێ' },
    ],
  },
});

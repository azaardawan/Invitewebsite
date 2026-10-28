import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Pink Ribbon Party: the customer's invitation to their own birthday party, from the designer's Pink Ribbon (#20)
 * — on cream paper inside pink ribbon bows, drawn in cherry red. Closed, a party popper waits; tapped, it bursts
 * while the cake, «Birthday», their name, the day and the place appear. Then the website, as Blush Floral's: the
 * details and the map, the countdown, the cake, their photos, a note from them signed in their own hand (feature
 * `signature`: it draws itself when the guest scrolls to it), the reply card with the guests' wishes, and a
 * closing.
 */
const allFields = ['person_1_name', 'event_date', 'event_time', 'venue_name', 'venue_map_url', 'invitation_message'] as const;

export default defineTheme({
  key: 'pink-ribbon-party',
  version: 1,
  title: { ar: 'حفلة الشريطة الوردية', en: 'Pink Ribbon Party', ckb: 'ئاهەنگی پاپیۆنی پەمەیی', bdn: 'ئاهەنگا پاپیۆنا پەمبەیی' },
  experience: 'INVITATION',
  sections: ['birthday'],
  fields: [...allFields],
  // A birthday is not always held somewhere in particular: the customer may leave the place (and its map link) empty.
  optionalFields: ['venue_name', 'venue_map_url'],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'signature', 'photos'],
  // Example packages; the owner builds the real ones in Admin from any combination.
  validStates: [
    { features: ['countdown', 'map'], fields: [...allFields] },
    // A package without the place at all.
    { features: ['countdown'], fields: ['person_1_name', 'event_date', 'event_time', 'invitation_message'] },
    { features: ['music', 'countdown', 'map', 'rsvp', 'signature'], fields: [...allFields] },
    // The complete design: + the guests' wishes and the customer's photos.
    { features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'signature', 'photos'], fields: [...allFields] },
  ],
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

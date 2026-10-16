import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Internal demo of the `photos` feature: the customer's own photos, the first on the cover and the rest in a
 * gallery. Never sold; it shows designers how `props.photos` and `<Photo>` work, and the tests use it.
 */
export default defineTheme({
  key: 'demo-photos',
  version: 1,
  title: { ar: 'تصميم صور تجريبي', en: 'Photos demo theme' },
  experience: 'INVITATION',
  sections: ['wedding'],
  fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name'],
  features: ['photos', 'rsvp'],
  validStates: [
    { features: ['rsvp'], fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name'] },
    { features: ['photos', 'rsvp'], fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name'] },
  ],
  photos: {
    max: 7,
    min: 1,
    aspect: 0.75,
    labels: [
      { ar: 'صورة الغلاف', en: 'Cover photo' },
      { ar: 'صورة الخطوبة', en: 'Engagement photo' },
    ],
  },
  internal: true,
});

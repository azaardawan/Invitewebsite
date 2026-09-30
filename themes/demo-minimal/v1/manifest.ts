import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Second internal demo, deliberately different (birthday, 2 packages, no
 * print companions). Proves themes are independent of each other.
 */
export default defineTheme({
  key: 'demo-minimal',
  version: 1,
  title: { ar: 'تصميم بسيط تجريبي', en: 'Minimal demo theme' },
  experience: 'INVITATION',
  sections: ['birthday'],
  fields: ['person_1_name', 'event_date', 'event_time', 'venue_name'],
  features: ['music', 'rsvp'],
  validStates: [
    { features: ['music'], fields: ['person_1_name', 'event_date', 'event_time', 'venue_name'] },
    { features: ['music', 'rsvp'], fields: ['person_1_name', 'event_date', 'event_time', 'venue_name'] },
  ],
  internal: true,
});

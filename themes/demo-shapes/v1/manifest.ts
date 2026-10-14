import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Internal demo for printable card shapes (development and automated tests): a wedding design whose card
 * comes in every shape the platform knows, A5 first. It has no print/Card.tsx, so the platform's simple card
 * is printed, cut to each shape. `internal: true`: never on sale.
 */
export default defineTheme({
  key: 'demo-shapes',
  version: 1,
  title: { ar: 'تصميم أشكال البطاقة التجريبي', en: 'Card shapes demo theme' },
  experience: 'INVITATION',
  sections: ['wedding'],
  fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name'],
  features: ['print_card'],
  validStates: [{ features: ['print_card'], fields: ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name'] }],
  print: { card: { size: 'A5', shapes: ['A5', 'leaf', 'heart', 'oval', 'ogee-arch', 'butterfly', 'cloud'], bleedMm: 3, qr: true } },
  internal: true,
});

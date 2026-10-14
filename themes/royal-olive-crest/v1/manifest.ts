import { defineTheme } from '@/theme-sdk/manifest';

/**
 * Royal Olive Crest: an olive-green envelope sealed with a gold wax seal bearing the couple's initials
 * opens onto a crowned crest in gold, then cream pages framed in gold. Design brief and hand-off:
 * docs/themes/royal-olive-crest/brief.md.
 */
const allFields = [
  'person_1_name',
  'person_2_name',
  'seal_initials',
  'event_date',
  'event_time',
  'venue_name',
  'venue_map_url',
  'invitation_message',
] as const;

export default defineTheme({
  key: 'royal-olive-crest',
  version: 1,
  title: { ar: 'الشعار الملكي الزيتوني', en: 'Royal Olive Crest' },
  experience: 'INVITATION',
  sections: ['wedding'],
  fields: [...allFields],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card'],
  // Example packages; the owner builds the real ones in Admin from any combination.
  validStates: [
    // A printed card and the online invitation with its music.
    {
      features: ['music', 'print_card'],
      fields: ['person_1_name', 'person_2_name', 'seal_initials', 'event_date', 'event_time', 'venue_name', 'invitation_message'],
    },
    // + countdown, map button, guest name with attending / not attending.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'print_card'],
      fields: [...allFields],
    },
    // The complete theme: + messages to the couple and the keepsake PDF.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card'],
      fields: [...allFields],
    },
  ],
  // The symbol between the two initials on the wax seal (when the customer doesn't type the initials).
  wording: [
    {
      key: 'sealJoin',
      label: { ar: 'الرمز بين الحرفين على الختم', en: 'Symbol between the initials on the seal' },
      ar: '&',
      options: ['♥', '·', 'و'],
      custom: false,
      maxLength: 1,
    },
  ],
  print: { card: { size: 'A5', bleedMm: 3, qr: true }, keepsake: { size: 'A4' } },
});

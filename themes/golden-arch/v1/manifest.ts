import { defineTheme } from '@/theme-sdk/manifest';
import { ARCH_OUTLINE } from './outlines';

/**
 * Golden Arch: a graduation invitation built from the owner's poster (white roses and eucalyptus in watercolour, a
 * gold arch, the gold laurel with the cap, line-drawn hands throwing their caps). Opening: the gold arch draws itself
 * around the graduate's name while the flowers bloom in from the corners and the caps fly. Then the website: the
 * portrait arch, the countdown, the day, the reply card and the guest messages. The portrait arch holds the laurel and
 * the year until photographs can be added. Poster: docs/themes/golden-arch/.
 */
const allFields = [
  'person_1_name',
  'achievement',
  'class_year',
  'event_date',
  'event_time',
  'venue_name',
  'venue_map_url',
  'invitation_message',
] as const;

export default defineTheme({
  key: 'golden-arch',
  version: 1,
  title: { ar: 'القوس الذهبي', en: 'Golden Arch' },
  experience: 'INVITATION',
  sections: ['graduation'],
  fields: [...allFields],
  features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_arch'],
  // Example packages; the owner builds the real ones in Admin from any combination.
  validStates: [
    {
      features: ['music', 'countdown', 'print_card'],
      fields: ['person_1_name', 'achievement', 'class_year', 'event_date', 'event_time', 'venue_name', 'invitation_message'],
    },
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'print_card'],
      fields: [...allFields],
    },
    // The complete design: + messages to the graduate, the keepsake PDF and the arch-shaped card.
    {
      features: ['music', 'countdown', 'map', 'rsvp', 'congratulations', 'keepsake_pdf', 'print_card', 'card_arch'],
      fields: [...allFields],
    },
  ],
  // The poster's script line under the venue.
  wording: [
    {
      key: 'followLine',
      label: { ar: 'السطر المكتوب بخط اليد تحت المكان', en: 'Handwritten line under the venue' },
      ar: 'وتكتمل الفرحة بلقائكم',
      versions: { en: 'Reception to follow!' },
      defaultIn: ['en'],
      maxLength: 40,
    },
  ],
  print: {
    // The poster's deep green on its paper (transparent background).
    card: { size: 'A5', bleedMm: 3, qr: true, qrColors: { dark: '#345440', light: '#00000000' } },
    keepsake: { size: 'A4' },
    // The gold arch as a card of its own (outlines.ts).
    shapes: [{ key: 'arch', label: { ar: 'قوس', en: 'Arch' }, widthMm: 110, heightMm: 170, outline: ARCH_OUTLINE }],
  },
});

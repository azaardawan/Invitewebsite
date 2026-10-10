import { defineTheme, kitStates } from '@/theme-sdk/manifest';

const features = ['kit_story', 'kit_card', 'kit_sticker', 'kit_bottle'] as const;
const fields = ['baby_name', 'father_name', 'birth_date'] as const;

/**
 * Embroidered Garden (boys): white embroidered flowers, sage leaves and
 * stitched doves on cream linen; the baby's name is "stitched" in sage thread.
 * A design kit: Instagram story, A5 card, chocolate stickers, bottle wrap.
 * The owner's original story is in docs/themes/embroidered-garden/.
 */
export default defineTheme({
  key: 'embroidered-garden',
  version: 1,
  title: { ar: 'حديقة التطريز — مولود', en: 'Embroidered Garden — baby boy' },
  experience: 'DESIGN_KIT',
  sections: ['baby'],
  fields: [...fields],
  features: [...features],
  validStates: kitStates(features, fields),
});

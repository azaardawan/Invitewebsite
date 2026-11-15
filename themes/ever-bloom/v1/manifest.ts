import { defineTheme } from '@/theme-sdk/manifest';
import { WORDING } from './copy';

/**
 * Ever Bloom (Couples): a little gift of love (owner, 2026-11-14). Closed, a hand-drawn gift; tapped, rings of
 * watercolour flowers grow from it and turn until they cover the screen, then fall away (motion.ts). Below: the
 * title, the couple's photos as a polaroid collage (the photo collages' artwork, without any birthday drawing or
 * wording; the names where the birthday lettering was), the customer's own letter on cream paper, signed, and a
 * closing bouquet. A template design: the customer writes the names, the letter and every line in place.
 */
const fields = ['person_1_name', 'person_2_name', 'letter'] as const;

export default defineTheme({
  key: 'ever-bloom',
  version: 1,
  title: {
    ar: 'إيفر بلوم',
    en: 'Ever Bloom',
    ckb: 'ئێڤەر بلووم',
    bdn: 'ئێڤەر بلووم',
  },
  experience: 'INVITATION',
  sections: ['couples'],
  fields: [...fields],
  features: ['photos', 'music'],
  editor: 'template',
  validStates: [
    { features: ['photos'], fields: [...fields] },
    { features: ['photos', 'music'], fields: [...fields] },
  ],
  // The three places of the polaroid collage, in its frames' shapes (the big one, the small one, the tall one).
  photos: {
    max: 3,
    aspect: 1.04,
    frames: [{ aspect: 1.04 }, { aspect: 1.04 }, { aspect: 0.585 }],
    labels: [
      {
        ar: 'الصورة الكبيرة',
        en: 'The big photo',
        ckb: 'وێنە گەورەکە',
        bdn: 'وێنێ مەزن',
      },
      {
        ar: 'الصورة الصغيرة',
        en: 'The small photo',
        ckb: 'وێنە بچووکەکە',
        bdn: 'وێنێ بچووک',
      },
      {
        ar: 'الصورة الطويلة',
        en: 'The tall photo',
        ckb: 'وێنە درێژەکە',
        bdn: 'وێنێ درێژ',
      },
    ],
  },
  wording: WORDING,
});

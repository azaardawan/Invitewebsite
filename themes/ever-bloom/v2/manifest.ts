import { defineTheme } from '@/theme-sdk/manifest';
import { WORDING } from './copy';

/**
 * Ever Bloom (Couples): a little gift of love (owner, 2026-11-14). Closed, a hand-drawn gift; tapped, rings of
 * watercolour flowers grow from it and turn until they cover the screen, then drift down slowly (v2, owner
 * 2026-11-15) as the page shows through (motion.ts). Below: the title, the couple's photos in the photo collages'
 * artwork (no birthday drawing or wording; the names where the birthday lettering was): the polaroids, and with bigger
 * packages the story collage and the photo wall (v2); the customer's own letter on cream paper, signed, and a closing
 * bouquet. A template design: the customer writes the names, the letter and every line in place.
 */
const fields = ['person_1_name', 'person_2_name', 'letter'] as const;

export default defineTheme({
  key: 'ever-bloom',
  version: 2,
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
  // The collages' places, in the order bigger packages sell them (Admin → the package's photo limit): 3 the polaroids,
  // 7 + the story collage, 16 + the photo wall. Each place in its frame's shape.
  photos: {
    max: 16,
    aspect: 1.04,
    frames: [
      // The polaroids: the big one, the small one, the tall one.
      { aspect: 1.04 },
      { aspect: 1.04 },
      { aspect: 0.585 },
      // The story.
      { aspect: 0.972 },
      { aspect: 0.692 },
      { aspect: 0.688 },
      { aspect: 0.672 },
      // The photo wall: the polaroid in the middle, then the eight around it.
      { aspect: 0.942 },
      { aspect: 0.652 },
      { aspect: 0.692 },
      { aspect: 0.658 },
      { aspect: 0.634 },
      { aspect: 0.639 },
      { aspect: 0.655 },
      { aspect: 0.695 },
      { aspect: 0.66 },
    ],
    labels: [
      { ar: 'الصورة الكبيرة', en: 'The big photo', ckb: 'وێنە گەورەکە', bdn: 'وێنێ مەزن' },
      { ar: 'الصورة الصغيرة', en: 'The small photo', ckb: 'وێنە بچووکەکە', bdn: 'وێنێ بچووک' },
      { ar: 'الصورة الطويلة', en: 'The tall photo', ckb: 'وێنە درێژەکە', bdn: 'وێنێ درێژ' },
      ...[1, 2, 3, 4].map((n) => ({ ar: `الستوري: صورة ${n}`, en: `Story: photo ${n}`, ckb: `ستۆری: وێنەی ${n}`, bdn: `ستۆری: وێنێ ${n}` })),
      { ar: 'جدار الصور: الصورة الوسطى', en: 'Photo wall: the middle photo', ckb: 'دیواری وێنە: وێنەی ناوەڕاست', bdn: 'دیوارێ وێنەیان: وێنێ ناڤەڕاستێ' },
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
        ar: `جدار الصور: صورة ${n}`,
        en: `Photo wall: photo ${n}`,
        ckb: `دیواری وێنە: وێنەی ${n}`,
        bdn: `دیوارێ وێنەیان: وێنێ ${n}`,
      })),
    ],
  },
  wording: WORDING,
});

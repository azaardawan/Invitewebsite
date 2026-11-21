import { defineTheme } from '@/theme-sdk/manifest';
import { BLUSH, PHOTO_ASPECT, PHOTO_SET } from './plan';
import { DRAWER_TEXTS, EXTRA_TEXTS, ROOM_NAMES, ORDINAL } from './texts';

/**
 * Pink Dreamhouse (owner, 2026-11-19): a pink dollhouse the birthday person walks through in 3D (the owner's models,
 * `assets/house-<tier>.glb`; `<World3D>`), with the customer's photos on its walls, their videos on its screens, their
 * messages in its drawers, a gift, a cake and (biggest package) a secret birthday suite that opens once every memory
 * has been found. Three sizes, by the photos a package sells: 6 (living room and bedroom), 12 (and the kitchen and the
 * vanity upstairs, one video), 24 (and the cinema and the secret suite, three videos). Not an invitation: «Enter the
 * house». Each package offers its own colour sets (Admin). A template design: the customer fills it in place.
 * Sold in Birthday or Friends (the owner chooses in Admin); the words follow `props.occasion`.
 */
const fields = ['person_1_name', 'invitation_message'] as const;
const friendsFields = ['person_1_name', 'person_2_name', 'invitation_message'] as const;

// The designed packages (for samples and checks): with and without video, colours and music, for one name or two.
const states: ('photos' | 'video' | 'color_choice' | 'music')[][] = [
  ['photos', 'video', 'color_choice', 'music'],
  ['photos', 'video', 'color_choice'],
  ['photos', 'color_choice'],
  ['photos', 'video'],
  ['photos'],
];

export default defineTheme({
  key: 'pink-dreamhouse',
  version: 1,
  title: { ar: 'بيت الأحلام الوردي', en: 'Pink Dreamhouse', ckb: 'خانووی خەونی پەمەیی', bdn: 'خانیێ خەونێ پەمبەیی' },
  experience: 'INVITATION',
  sections: ['birthday', 'friends'],
  fields: [...friendsFields],
  features: ['photos', 'video', 'color_choice', 'music'],
  // The house's six colours (the "Blush Cream" palette); the owner's colour sets change them all at once.
  colors: {
    slots: [
      { key: 'walls', label: { ar: 'الجدران', en: 'Walls' }, default: BLUSH.walls },
      { key: 'walls-light', label: { ar: 'الجدار الخلفي', en: 'Back walls' }, default: BLUSH['walls-light'] },
      { key: 'accent', label: { ar: 'اللون البارز', en: 'Accent' }, default: BLUSH.accent },
      { key: 'floor', label: { ar: 'الأرضية', en: 'Floor' }, default: BLUSH.floor },
      { key: 'trim', label: { ar: 'الإطارات', en: 'Trim' }, default: BLUSH.trim },
      { key: 'metal', label: { ar: 'الذهبي', en: 'Gold details' }, default: BLUSH.metal },
    ],
  },
  editor: 'template',
  pageTexts: {
    open: { ar: 'ادخل البيت', en: 'Enter the house', ckb: 'بچۆ ناو خانووەکە', bdn: 'وەرە د ناڤ خانی دا' },
    share: { ar: 'بيت صغير مليء بالذكريات، لك أنت', en: 'A little house full of memories, just for you', ckb: 'خانوویەکی بچووکی پڕ لە یادەوەری، تەنها بۆ تۆ', bdn: 'خانیەکێ بچووک تژی بیرهاتن، بتنێ بۆ تە' },
    endedTitle: { ar: 'أُغلق هذا البيت', en: 'This house has closed', ckb: 'ئەم خانووە داخرا', bdn: 'ئەڤ خانیە هاتە گرتن' },
    endedBody: { ar: 'شكراً لزيارتكم. هذا البيت لم يعد مفتوحاً.', en: 'Thank you for visiting. This house is no longer open.', ckb: 'سوپاس بۆ سەردانەکەتان. ئەم خانووە ئیتر کراوە نییە.', bdn: 'سوپاس بۆ سەرەدانا هەوە. ئەڤ خانیە ئێدی ڤەکری نینە.' },
  },
  validStates: [
    ...states.map((features) => ({ features, fields: [...friendsFields] })),
    ...states.map((features) => ({ features, fields: [...fields] })),
  ],
  wording: [
    // Each room's name, on its plate (the bedroom's also over its door).
    ...ROOM_NAMES.map((n, i) => ({
      key: `room${i + 1}`,
      label: { ar: `اسم الغرفة ${ORDINAL[i]!.ar}`, en: `The ${ORDINAL[i]!.en} room’s name`, ckb: `ناوی ژووری ${ORDINAL[i]!.ckb}`, bdn: `ناڤێ ژوورا ${ORDINAL[i]!.bdn}` },
      ar: n.ar,
      versions: { en: n.en, ckb: n.ckb, bdn: n.bdn },
      defaultIn: ['en', 'ckb', 'bdn'] as ('en' | 'ckb' | 'bdn')[],
      maxLength: 28,
    })),
    // A message in each drawer.
    ...DRAWER_TEXTS.map((t, i) => ({
      key: `drawer${i + 1}`,
      label: { ar: `رسالة الدرج ${i + 1}`, en: `Drawer ${i + 1}’s message`, ckb: `نامەی چەکمەجەی ${i + 1}`, bdn: `نامەیا چەکمەجا ${i + 1}` },
      ar: t.ar,
      versions: { en: t.en, ckb: t.ckb, bdn: t.bdn },
      defaultIn: ['en', 'ckb', 'bdn'] as ('en' | 'ckb' | 'bdn')[],
      maxLength: 120,
    })),
    // The gift's words, the cupcake's note, the mirror's message and the chest's last words.
    ...EXTRA_TEXTS.map((t) => ({
      key: t.key,
      label: t.label,
      ar: t.ar,
      versions: { en: t.en, ckb: t.ckb, bdn: t.bdn },
      defaultIn: ['en', 'ckb', 'bdn'] as ('en' | 'ckb' | 'bdn')[],
      maxLength: 120,
    })),
  ],
  // 24 places: three in each of the four smaller rooms, six in the cinema and the suite; they fill by threes.
  // And a photo in each drawer, if the customer adds one (owner, 2026-11-19): places 50–57, not counted in a package.
  photos: { max: 24, set: PHOTO_SET, aspect: PHOTO_ASPECT, attached: 8 },
  // The fridge (VIP), the cinema and the suite (VVIP).
  videos: {
    max: 3,
    labels: [
      { ar: 'شاشة الثلاجة', en: 'The fridge screen', ckb: 'شاشەی سەلاجەکە', bdn: 'شاشا سەلاجێ' },
      { ar: 'شاشة السينما', en: 'The cinema screen', ckb: 'شاشەی سینەماکە', bdn: 'شاشا سینەمایێ' },
      { ar: 'شاشة الجناح السري', en: 'The secret suite’s screen', ckb: 'شاشەی ژووری نهێنی', bdn: 'شاشا ژوورا نهێنی' },
    ],
  },
});

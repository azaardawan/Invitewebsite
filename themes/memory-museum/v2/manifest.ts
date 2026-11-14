import { defineTheme } from '@/theme-sdk/manifest';
import { PER_ROOM, ROOMS, SPOT_ASPECT } from './plan';
import { ROOM_NAMES, ROOM_TEXTS, WARM_CREAM } from './rooms';

/**
 * v2 (owner, 2026-11-14): also for Friends (the design's room names, sample words follow `props.occasion`), and the
 * walls' warm cream can be changed with colour choice (slot `walls`; the owner's five colour sets).
 *
 * Memory Museum (Couples, owner 2026-11-13): the couple's photos hang as paintings in a museum their guests walk
 * through in 3D (the owner's model, `assets/museum.glb`; `<Gallery3D>`). Three wings of two rooms (eight photos each)
 * around a hall under a glass pyramid; each room is a photo set. The owner sells three packages: 2 rooms (the front
 * wing, 16 photos), 4 (and the left wing, 32) and 6 (the whole museum, 48); rooms without photos are walled off. Each
 * room has a name and a few words; each photo its title and few words, on a card under it. The couple's video plays from the screen at the entrance; without
 * one the screen shows their names and story. On a device without 3D, and in the editor, the rooms are shown flat.
 * A template design: the customer fills it in place (`editor: 'template'`).
 */
const allFields = ['person_1_name', 'person_2_name', 'invitation_message'] as const;

const ORDINAL = [
  { ar: 'الأولى', en: 'first', ckb: 'یەکەم', bdn: 'ئێکێ' },
  { ar: 'الثانية', en: 'second', ckb: 'دووەم', bdn: 'دووێ' },
  { ar: 'الثالثة', en: 'third', ckb: 'سێیەم', bdn: 'سێیێ' },
  { ar: 'الرابعة', en: 'fourth', ckb: 'چوارەم', bdn: 'چارێ' },
  { ar: 'الخامسة', en: 'fifth', ckb: 'پێنجەم', bdn: 'پێنجێ' },
  { ar: 'السادسة', en: 'sixth', ckb: 'شەشەم', bdn: 'شەشێ' },
];

export default defineTheme({
  key: 'memory-museum',
  version: 2,
  title: { ar: 'متحف الذكريات', en: 'Memory Museum', ckb: 'مۆزەخانەی یادەوەری', bdn: 'مۆزەخانەیا بیرهاتنان' },
  experience: 'INVITATION',
  // Couples, and Friends (owner, 2026-11-14): the design's words follow `props.occasion`.
  sections: ['couples', 'friends'],
  fields: [...allFields],
  // Colour choice (owner, 2026-11-14): a package may let the customer change the warm cream of the walls.
  features: ['photos', 'video', 'color_choice'],
  colors: {
    slots: [{ key: 'walls', label: { ar: 'لون جدران المتحف', en: 'The museum’s wall colour' }, default: WARM_CREAM }],
  },
  editor: 'template',
  // Not an invitation: a museum (owner, 2026-11-13). The button, the shared link's text and the closed page say so.
  pageTexts: {
    open: { ar: 'افتح المتحف', en: 'Open the museum', ckb: 'مۆزەخانەکە بکەرەوە', bdn: 'مۆزەخانێ ڤەکە' },
    share: { ar: 'تفضلوا بزيارة متحف ذكرياتنا', en: 'Come and visit our memory museum', ckb: 'فەرموون سەردانی مۆزەخانەی یادەوەرییەکانمان بکەن', bdn: 'فەرموون سەرەدانا مۆزەخانەیا بیرهاتنێن مە بکەن' },
    endedTitle: { ar: 'أُغلق هذا المتحف', en: 'This museum has closed', ckb: 'ئەم مۆزەخانەیە داخرا', bdn: 'ئەڤ مۆزەخانە هاتە گرتن' },
    endedBody: { ar: 'شكراً لزيارتكم. هذا المتحف لم يعد مفتوحاً.', en: 'Thank you for visiting. This museum is no longer open.', ckb: 'سوپاس بۆ سەردانەکەتان. ئەم مۆزەخانەیە ئیتر کراوە نییە.', bdn: 'سوپاس بۆ سەرەدانا هەوە. ئەڤ مۆزەخانە ئێدی ڤەکری نینە.' },
  },
  validStates: [
    { features: ['photos', 'video', 'color_choice'], fields: [...allFields] },
    { features: ['photos', 'video'], fields: [...allFields] },
    { features: ['photos'], fields: [...allFields] },
  ],
  wording: [
    {
      key: 'title',
      label: { ar: 'اسم متحفكما', en: 'Your museum’s name', ckb: 'ناوی مۆزەخانەکەتان', bdn: 'ناڤێ مۆزەخانەیا هەوە' },
      ar: 'متحف ذكرياتنا',
      versions: { en: 'Our Memory Museum', ckb: 'مۆزەخانەی یادەوەرییەکانمان', bdn: 'مۆزەخانەیا بیرهاتنێن مە' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 30,
    },
    {
      key: 'since',
      label: { ar: 'سطر التاريخ', en: 'The date line', ckb: 'دێڕی بەروار', bdn: 'رێزا رێکەفتێ' },
      ar: 'منذ 14 شباط 2019',
      versions: { en: 'Since 14 February 2019', ckb: 'لە ١٤ی شوباتی ٢٠١٩ەوە', bdn: 'ژ ١٤ی شوباتا ٢٠١٩ێ' },
      defaultIn: ['en', 'ckb', 'bdn'],
      maxLength: 32,
    },
    // Each room: its name (on the sign over its doorway) and a few words about it (shown as the visitor walks in).
    ...ROOMS.flatMap((key, i) => [
      {
        key,
        label: {
          ar: `اسم القاعة ${ORDINAL[i]!.ar}`,
          en: `The ${ORDINAL[i]!.en} room’s name`,
          ckb: `ناوی هۆڵی ${ORDINAL[i]!.ckb}`,
          bdn: `ناڤێ هۆلا ${ORDINAL[i]!.bdn}`,
        },
        ar: ROOM_NAMES[i]!.ar,
        versions: { en: ROOM_NAMES[i]!.en, ckb: ROOM_NAMES[i]!.ckb, bdn: ROOM_NAMES[i]!.bdn },
        defaultIn: ['en', 'ckb', 'bdn'] as ('en' | 'ckb' | 'bdn')[],
        maxLength: 24,
      },
      {
        key: `${key}Text`,
        label: {
          ar: `وصف القاعة ${ORDINAL[i]!.ar}`,
          en: `The ${ORDINAL[i]!.en} room’s description`,
          ckb: `وەسفی هۆڵی ${ORDINAL[i]!.ckb}`,
          bdn: `وەسفا هۆلا ${ORDINAL[i]!.bdn}`,
        },
        ar: ROOM_TEXTS[i]!.ar,
        versions: { en: ROOM_TEXTS[i]!.en, ckb: ROOM_TEXTS[i]!.ckb, bdn: ROOM_TEXTS[i]!.bdn },
        defaultIn: ['en', 'ckb', 'bdn'] as ('en' | 'ckb' | 'bdn')[],
        maxLength: 120,
      },
    ]),
  ],
  // Six rooms of eight; each room is a set (a package sells 1 to 6 rooms in Admin) and fills on its own.
  photos: { max: ROOMS.length * PER_ROOM, min: 1, set: PER_ROOM, aspect: SPOT_ASPECT },
});

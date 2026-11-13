import { defineTheme } from '@/theme-sdk/manifest';
import { PER_ROOM, ROOMS, SPOT_ASPECT } from './plan';

/**
 * Memory Museum (Couples, owner 2026-11-13): the couple's photos hang as paintings in a museum their guests walk
 * through in 3D (the owner's model, `assets/museum.glb`; `<Gallery3D>`). Six galleries of eight photos around a hall
 * under a glass pyramid; each gallery is a photo set, so a package sells 1 to 6 rooms (Admin → package "Photos in this
 * package"), and rooms without photos are walled off. The couple's video plays from the screen at the entrance; without
 * one the screen shows their names and story. On a device without 3D, and in the editor, the rooms are shown flat.
 * A template design: the customer fills it in place (`editor: 'template'`).
 */
const allFields = ['person_1_name', 'person_2_name', 'invitation_message'] as const;

const ROOM_NAMES = [
  { ar: 'البداية', en: 'The beginning', ckb: 'سەرەتا', bdn: 'دەستپێک' },
  { ar: 'خطوبتنا', en: 'Our engagement', ckb: 'دەستگیرانیمان', bdn: 'دەستگیرانیا مە' },
  { ar: 'زفافنا', en: 'Our wedding', ckb: 'زەماوەندەکەمان', bdn: 'داوەتا مە' },
  { ar: 'سفراتنا', en: 'Our trips', ckb: 'گەشتەکانمان', bdn: 'گەشتێن مە' },
  { ar: 'لحظاتنا', en: 'Our moments', ckb: 'ساتەکانمان', bdn: 'دەمێن مە' },
  { ar: 'إلى الأبد', en: 'Forever', ckb: 'بۆ هەمیشە', bdn: 'بۆ هەروهەر' },
];
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
  version: 1,
  title: { ar: 'متحف الذكريات', en: 'Memory Museum', ckb: 'مۆزەخانەی یادەوەری', bdn: 'مۆزەخانەیا بیرهاتنان' },
  experience: 'INVITATION',
  sections: ['couples'],
  fields: [...allFields],
  features: ['photos', 'video'],
  editor: 'template',
  validStates: [
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
    ...ROOMS.map((key, i) => ({
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
    })),
  ],
  // Six rooms of eight; each room is a set (a package sells 1 to 6 rooms in Admin) and fills on its own.
  photos: { max: ROOMS.length * PER_ROOM, min: 1, set: PER_ROOM, aspect: SPOT_ASPECT },
});

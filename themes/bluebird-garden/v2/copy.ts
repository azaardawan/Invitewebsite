/**
 * The design's wording (owner, 2026-10-11). The Arabic praise lines and the du'a never change, in any
 * language. The customer's parts: the names, the date of birth, the connector «بن» and the birth order
 * (manifest `wording`, props.wording.sonOf / props.wording.order). Stretched letters (tatweel) as in the
 * owner's design.
 */
export const PRAISE = ['الحمد لله على تمـــام النعمة واكتمـال المِنّـــة', 'الحمد لله الذي جعل لنا من زينة الحياة نصيبـاً', 'ومن الذكـــور حظّـاً وسنـــداً'];
export const DUA = ['جعلـــه الله فرحـــة وبركـــة', 'وغيثـــاً أينمـــا حـــلّ'];
export const HANDLE = '@Bahjaa.iq';

/** «وهبنا الله … أفراحنا وأميرنا …»: the customer picks the birth order; first is the default. */
const ORDINAL = [
  ['أوّل', 'الأوّل'],
  ['ثاني', 'الثاني'],
  ['ثالث', 'الثالث'],
  ['رابع', 'الرابع'],
] as const;
const orderLine = ([n, the]: readonly [string, string]) => `وهبنـــا الله ${n} أفراحنـــا وأميرنـــا ${the}`;
export const ORDER = { ar: orderLine(ORDINAL[0]), options: ORDINAL.slice(1).map(orderLine), custom: false } as const;

/** «son of»: each language's own word by default (owner, 2026-10-11); «بن» and the customer's own word are choices. */
export const SON_OF = { ar: 'بن', versions: { en: 'Son of', ckb: 'کوڕی', bdn: 'کوڕێ' }, defaultIn: ['en', 'ckb', 'bdn'] } as const;

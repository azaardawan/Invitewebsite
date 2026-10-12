/**
 * The design's wording: the girl's version of Bluebird Garden (owner, 2026-10-12). The Arabic praise lines and the du'a never change, in any
 * language. The customer's parts: the names, the date of birth, the connector «بنت» and the birth order
 * (manifest `wording`, props.wording.sonOf / props.wording.order). Stretched letters (tatweel) as in the
 * owner's design.
 */
export const PRAISE = ['الحمد لله على تمـــام النعمة واكتمـال المِنّـــة', 'الحمد لله الذي جعل لنا من زينة الحياة نصيبـاً', 'ومن البنـــات رحمـةً ونـــوراً'];
export const DUA = ['جعلهـــا الله فرحـــة وبركـــة', 'وغيثـــاً أينمـــا حلّـــت'];
export const HANDLE = '@Bahjaa.iq';

/** «وهبنا الله … أفراحنا وأميرتنا …»: the customer picks the birth order; first is the default. */
const ORDINAL = [
  ['أوّل', 'الأولى'],
  ['ثاني', 'الثانية'],
  ['ثالث', 'الثالثة'],
  ['رابع', 'الرابعة'],
] as const;
const orderLine = ([n, the]: readonly [string, string]) => `وهبنـــا الله ${n} أفراحنـــا وأميرتنـــا ${the}`;
export const ORDER = { ar: orderLine(ORDINAL[0]), options: ORDINAL.slice(1).map(orderLine), custom: false } as const;

/** «daughter of»: each language's own word by default; «بنت» and the customer's own word are choices. Kurdish «کچی» / «کچا» approved by the owner (2026-10-12). */
export const SON_OF = { ar: 'بنت', versions: { en: 'Daughter of', ckb: 'کچی', bdn: 'کچا' }, defaultIn: ['en', 'ckb', 'bdn'] } as const;

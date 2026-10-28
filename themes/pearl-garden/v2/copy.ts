/**
 * The design's wording (owner, 2026-10-13). The praise lines, «وأكرمنا الله بأجمل العطايا» and the du'a never
 * change, in any language. The customer's parts: the names, the date of birth and the connector «بنت»
 * (manifest `wording`, props.wording.sonOf). Corrected with the owner: «على» (the design had «علي») and
 * «قرةَ عينٍ» (the design had «عينَ»).
 */
export const PRAISE = ['الحمدُ لله على جميلِ ما أعطى', 'وعلى لُطفِه فيما وهب', 'أشرقت حياتُنا بقدومِ صغيرتِنا'];
export const GIFT = 'وأكرمنا اللهُ بأجملِ العطايا';
export const DUA = ['اللّهمَّ احفظها بعينِك التي لا تنام', 'وأنِر قلبَها بالإيمان', 'واجعلها قرّةَ عينٍ لنا', 'وبارِك لنا فيها'];
export const HANDLE = '@Bahjaa.iq';

/** «daughter of»: each language's own word by default (owner-approved, as for designs #8 and #9); «بنت» and the customer's own word are choices. */
export const SON_OF = { ar: 'بنت', versions: { en: 'Daughter of', ckb: 'کچی', bdn: 'کچا' }, defaultIn: ['en', 'ckb', 'bdn'] } as const;

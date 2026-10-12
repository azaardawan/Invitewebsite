/**
 * The design's wording (owner, 2026-10-12): the praise lines, «أكرمنا الله بأجمل العطايا» and the du'a never
 * change, in any language. The customer's parts: the names, the date of birth and the connector «بنت»
 * (manifest `wording`, props.wording.sonOf). Stretched letters (tatweel) as in the owner's design. The du'a
 * reads «قرة عينٍ» (the owner's story had «عيناً»; corrected with the owner).
 */
export const PRAISE = ['الحـمد لله عـلى جميل مـا أعـطى', 'وعـظـيـم مـا وهـب'];
export const GIFT = 'أكـرمـنا الله بأجمل العطايا';
export const DUA = ['اللهـم أنبـتـها نـبـاتـاً حـسـنـاً', 'واجعلها قرة عينٍ لنا وبارك لنا فيها'];
export const HANDLE = '@Bahjaa.iq';

/** «daughter of»: each language's own word by default (owner-approved, as for design #8); «بنت» and the customer's own word are choices. */
export const SON_OF = { ar: 'بنت', versions: { en: 'Daughter of', ckb: 'کچی', bdn: 'کچا' }, defaultIn: ['en', 'ckb', 'bdn'] } as const;

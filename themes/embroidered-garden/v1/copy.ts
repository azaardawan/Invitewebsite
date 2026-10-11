/**
 * The design's wording. The Quran verse, the du'a and the Arabic blessing never change, in any language
 * (owner decision). Only the names and the connector «بن» are the customer's: «بن» is a changeable line
 * (manifest `wording`, props.wording.sonOf): "Son of" / «کوڕی» / «کوڕێ» by default on English / Sorani /
 * Badini orders, «بن» on Arabic ones; «بن» and the customer's own word are always choices.
 */
export const HAMD = ['الحمد لله الذي جعل لنا من زينة الحياة نصيبًا', 'ومـن الذكــــور حظًّا وسنـدًا'];
export const DUA = ['اللّهُمَّ أنبِتهُ نباتًا حسنًا واجعلهُ قُرّةَ عينٍ لنا', 'واجعَلـهُ صغيرًا بارًّا وكبيرًا بارًّا'];
/** Ruqaa letters don't take stretched joins (tatweel) well: the same words without them. */
export const HAMD_PLAIN = ['الحمد لله الذي جعل لنا من زينة الحياة نصيبًا', 'ومن الذكور حظًّا وسندًا'];
export const DUA_PLAIN = ['اللّهُمَّ أنبِتهُ نباتًا حسنًا واجعلهُ قُرّةَ عينٍ لنا', 'واجعَلهُ صغيرًا بارًّا وكبيرًا بارًّا'];

export const BLESSED = 'رزقنا الله بأجمل العطايا';
/** «son of» (owner, 2026-10-11): each language's own word is the default; «بن» on Arabic orders and a choice elsewhere. */
export const SON_OF = { ar: 'بن', versions: { en: 'Son of', ckb: 'کوڕی', bdn: 'کوڕێ' }, defaultIn: ['en', 'ckb', 'bdn'] } as const;

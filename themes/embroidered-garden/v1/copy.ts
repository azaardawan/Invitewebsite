/**
 * The design's wording. The verse and the du'a are always Arabic, whatever the language (owner decision).
 * The blessing and «بن» are changeable lines (manifest `wording`): Arabic by default in every language; the
 * customer may pick the version in their invitation's language or write their own (props.wording).
 * Kurdish blessing: none until the owner approves wording (docs/translations/KURDISH_REVIEW.md).
 */
export const HAMD = ['الحمد لله الذي جعل لنا من زينة الحياة نصيبًا', 'ومـن الذكــــور حظًّا وسنـدًا'];
export const DUA = ['اللّهُمَّ أنبِتهُ نباتًا حسنًا واجعلهُ قُرّةَ عينٍ لنا', 'واجعَلـهُ صغيرًا بارًّا وكبيرًا بارًّا'];
/** Ruqaa letters don't take stretched joins (tatweel) well: the same words without them. */
export const HAMD_PLAIN = ['الحمد لله الذي جعل لنا من زينة الحياة نصيبًا', 'ومن الذكور حظًّا وسندًا'];
export const DUA_PLAIN = ['اللّهُمَّ أنبِتهُ نباتًا حسنًا واجعلهُ قُرّةَ عينٍ لنا', 'واجعَلهُ صغيرًا بارًّا وكبيرًا بارًّا'];

export const BLESSED = { ar: 'رزقنا الله بأجمل العطايا', versions: { en: 'God has blessed us with the most beautiful of gifts' } } as const;
/** «son of» (owner's Kurdish wording, 2026-10-11). */
export const SON_OF = { ar: 'بن', versions: { en: 'son of', ckb: 'کوڕی', bdn: 'کوڕێ' } } as const;

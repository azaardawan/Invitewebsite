import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's wording. The verse and the du'a are always Arabic, whatever the language (owner decision);
 * the blessing and «بن» follow the language (Kurdish waits for owner-approved wording, see
 * docs/translations/KURDISH_REVIEW.md, and shows the Arabic until then).
 */
export const HAMD = ['الحمد لله الذي جعل لنا من زينة الحياة نصيبًا', 'ومـن الذكــــور حظًّا وسنـدًا'];
export const DUA = ['اللّهُمَّ أنبِتهُ نباتًا حسنًا واجعلهُ قُرّةَ عينٍ لنا', 'واجعَلـهُ صغيرًا بارًّا وكبيرًا بارًّا'];
/** Ruqaa letters don't take stretched joins (tatweel) well: the same words without them. */
export const HAMD_PLAIN = ['الحمد لله الذي جعل لنا من زينة الحياة نصيبًا', 'ومن الذكور حظًّا وسندًا'];
export const DUA_PLAIN = ['اللّهُمَّ أنبِتهُ نباتًا حسنًا واجعلهُ قُرّةَ عينٍ لنا', 'واجعَلهُ صغيرًا بارًّا وكبيرًا بارًّا'];

const AR = { blessed: 'رزقنا الله بأجمل العطايا', sonOf: 'بن' };
const COPY: Record<InvitationLocale, { blessed: string; sonOf: string }> = {
  ar: AR,
  en: { blessed: 'God has blessed us with the most beautiful of gifts', sonOf: 'son of' },
  ckb: AR,
  bdn: AR,
};

export function copyFor(locale: InvitationLocale) {
  return COPY[locale] ?? AR;
}

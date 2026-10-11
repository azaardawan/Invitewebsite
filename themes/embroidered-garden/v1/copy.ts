import type { InvitationLocale } from '@/theme-sdk';

/**
 * The design's wording. The verse and the du'a are always Arabic, whatever the language (owner decision);
 * «بن» follows the language (Kurdish as the owner wrote it, 2026-10-11). The blessing follows it too;
 * Kurdish shows the Arabic blessing until the owner approves wording (docs/translations/KURDISH_REVIEW.md).
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
  ckb: { blessed: AR.blessed, sonOf: 'کوری' },
  bdn: { blessed: AR.blessed, sonOf: 'کورێ' },
};

export function copyFor(locale: InvitationLocale) {
  return COPY[locale] ?? AR;
}

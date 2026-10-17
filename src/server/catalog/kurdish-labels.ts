import type { I18nContent } from '@/server/db/schema';

/**
 * Owner-approved Kurdish for order-form labels of designs whose activated (frozen) version can't carry it in its
 * manifest, matched by their exact Arabic. Used only where the manifest's own Sorani or Badini is empty.
 * Batch 23 (docs/translations/KURDISH_REVIEW.md), approved 2026-10-17.
 */
export const KURDISH_LABELS: Record<string, { ckb: string; bdn: string }> = {
  'كلمة «بن»': { ckb: 'وشەی «کوڕی»', bdn: 'پەیڤا «کوڕێ»' },
  'كلمة «بنت»': { ckb: 'وشەی «کچی»', bdn: 'پەیڤا «کچا»' },
  'ترتيب المولود': { ckb: 'ڕیزبەندی منداڵ', bdn: 'ڕیزبەندیا زاروکی' },
  'ترتيب المولودة': { ckb: 'ڕیزبەندی کچۆڵە', bdn: 'ڕیزبەندیا کچکێ' },
  'إظهار اسم الأب على ملصقات الشوكولاتة وملصق القنينة': {
    ckb: 'ناوی باوک لەسەر لکێنەری چوکلێت و لکێنەری بوتڵ پیشان بدرێت',
    bdn: 'ناڤێ بابی ل سەر لکێنەرێن چوکلێتێ و لکێنەرا بوتلێ بهێتە نیشاندان',
  },
};

/** The label with any missing Kurdish filled from the approved list. */
export function withKurdishLabel(label: I18nContent): I18nContent {
  const k = KURDISH_LABELS[label.ar.trim()];
  if (!k) return label;
  return { ...label, ckb: label.ckb?.trim() || k.ckb, bdn: label.bdn?.trim() || k.bdn };
}

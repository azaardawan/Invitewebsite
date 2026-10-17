import type { ThemeBorderSpec } from '@/theme-sdk';
import rule from './assets/gold-rule.svg';

/** A fine gold rule down both edges of the closing page and the printed cards, in the poster's arch gold. */
export const GOLD_BORDER: ThemeBorderSpec = { kind: 'strips', src: rule.src, size: 6, inset: 14 };

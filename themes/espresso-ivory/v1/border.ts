import type { ThemeBorderSpec } from '@/theme-sdk';
import rule from './assets/gold-rule.svg';

/**
 * The fine double gold rule down both sides of the envelope screen, the printed card and the keepsake. The theme
 * draws the matching top and bottom rules itself.
 */
export const GOLD_BORDER: ThemeBorderSpec = { kind: 'strips', src: rule.src, size: 6, inset: 16 };

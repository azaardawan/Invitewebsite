import type { ThemeBorderSpec } from '@/theme-sdk';
import rule from './assets/double-rule.svg';

/**
 * The slate-blue double rule down both sides, from the source invitation: on the opening page, the printed card
 * and the keepsake.
 */
export const RULE_BORDER: ThemeBorderSpec = { kind: 'strips', src: rule.src, size: 7, inset: 42 };

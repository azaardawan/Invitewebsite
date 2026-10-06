import type { ThemeBorderSpec } from '@/theme-sdk';
import heritage from './assets/heritage-border.webp';

/** Zaxo's heritage bands down both edges: the same on the invitation, the card and the keepsake. */
export const ZAXO_BORDER: ThemeBorderSpec = { kind: 'strips', src: heritage.src, size: 24, inset: 4 };

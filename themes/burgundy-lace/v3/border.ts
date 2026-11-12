import type { ThemeBorderSpec } from '@/theme-sdk';
import corner from './assets/lace-corner-tr.webp';

/**
 * Ivory lace corners on the envelope screen, the printed card and the keepsake. The platform draws the top-right
 * corner and the same artwork turned for the bottom-left; the theme adds the other two (only with its own artwork)
 * and the thin rails that join them.
 */
export const LACE_BORDER: ThemeBorderSpec = { kind: 'corners', src: corner.src, size: 114, inset: 10 };

import type { ThemeBorderSpec } from '@/theme-sdk';
import corner from './assets/botanical-corner-tr.webp';

/**
 * The engraved botanical corners, on the closing page and the printed cards. The platform draws the top-right corner
 * and the same artwork turned for the bottom-left (the artwork mirrored from the design's top-left corner).
 */
export const BOTANICAL_BORDER: ThemeBorderSpec = { kind: 'corners', src: corner.src, size: 120, inset: 8 };

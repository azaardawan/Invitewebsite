import type { ThemeBorderSpec } from '@/theme-sdk';
import corner from './assets/corner-tr.webp';

/**
 * The owner's olive sprig in the top-right corner (and turned, bottom-left), the same on the invitation, the card and
 * the keepsake. Every page also draws its own double bronze frame and the sprigs in the other corners (Frame.tsx).
 */
export const STITCH_BORDER: ThemeBorderSpec = { kind: 'corners', src: corner.src, size: 62, inset: 17 };

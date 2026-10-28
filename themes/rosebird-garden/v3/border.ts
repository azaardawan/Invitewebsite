import type { ThemeBorderSpec } from '@/theme-sdk';
import corner from './assets/corner.webp';

/** The design's pink flowers, hanging in the top corner and standing in the bottom one, around the guest pages. */
export const BORDER: ThemeBorderSpec = { kind: 'corners', src: corner.src, size: 104, inset: 0 };

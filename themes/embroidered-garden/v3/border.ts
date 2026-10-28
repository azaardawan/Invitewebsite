import type { ThemeBorderSpec } from '@/theme-sdk';
import corner from './assets/back-corner-tr.webp';

/** The card back's embroidered corner, at the top and (turned) the bottom of the guest pages. */
export const BORDER: ThemeBorderSpec = { kind: 'corners', src: corner.src, size: 112, inset: 0 };

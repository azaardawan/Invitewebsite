import type { ThemeBorderSpec } from '@/theme-sdk';
import lace from './assets/lace-strip.webp';

/** The burgundy lace from the poster, down both sides of the letter page, the printed card and the keepsake. */
export const LACE_BORDER: ThemeBorderSpec = { kind: 'strips', src: lace.src, size: 22, inset: 0 };

import type { ThemeBorderSpec } from '@/theme-sdk';
import corner from './assets/corner.svg';

/** A gold line with a pink heart in the top right corner, turned in the bottom left (the owner can replace it in Admin). */
export const HEART_BORDER: ThemeBorderSpec = { kind: 'corners', src: corner.src, size: 28, inset: 8 };

import type { ThemeBorderSpec } from '@/theme-sdk';
import bow from './assets/bow.svg';

/** The poster's ribbon bow, in the corners of the closing page. */
export const BOW_BORDER: ThemeBorderSpec = { kind: 'corners', src: bow.src, size: 64, inset: 10 };

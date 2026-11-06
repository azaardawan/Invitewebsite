import type { ThemeBorderSpec } from '@/theme-sdk';
import bow from './assets/bow.webp';

/** The design's pink satin bow in the top corners of the guest pages. */
export const BORDER: ThemeBorderSpec = { kind: 'corners', src: bow.src, size: 58, inset: 12 };

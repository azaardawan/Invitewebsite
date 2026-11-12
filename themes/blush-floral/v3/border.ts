import type { ThemeBorderSpec } from '@/theme-sdk';
import rosette from './assets/rosette.svg';

/** The designer's pink rosette, in the corners of the closing page. */
export const ROSETTE_BORDER: ThemeBorderSpec = { kind: 'corners', src: rosette.src, size: 56, inset: 10 };

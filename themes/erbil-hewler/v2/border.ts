import type { ThemeBorderSpec } from '@/theme-sdk';
import rosette from './assets/rosette.svg';

/** The design's sandstone-and-red kilim rosette in the corners. */
export const BORDER: ThemeBorderSpec = {
  kind: 'corners',
  src: rosette.src,
  size: 26,
  inset: 16,
};

import type { ThemeBorderSpec } from '@/theme-sdk';
import strip from './assets/kilim-strip.svg';

/** A Zakho kilim band down both edges (madder diamonds on a gold thread) of the closing page, the card and the keepsake. */
export const KILIM_BORDER: ThemeBorderSpec = {
  kind: 'strips',
  src: strip.src,
  size: 12,
  inset: 8,
};

import type { ThemeBorderSpec } from '@/theme-sdk';
import heart from './assets/heart.svg';

/** A small rose-ink heart in the corners of the letter's page. */
export const BORDER: ThemeBorderSpec = {
  kind: 'corners',
  src: heart.src,
  size: 22,
  inset: 14,
};

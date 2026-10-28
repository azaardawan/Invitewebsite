import type { ThemeBorderSpec } from '@/theme-sdk';
import branch from './assets/branch-left.webp';

/** The design's embroidered vine with its little birds, down both edges of the guest pages. */
export const BORDER: ThemeBorderSpec = { kind: 'strips', src: branch.src, size: 26, inset: 10 };

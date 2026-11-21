import type { ThemeBorderSpec } from '@/theme-sdk';
import branch from './assets/olive-branch-top.svg';

/** Olive branches in the top-right and bottom-left corners: the same on the invitation, the card and the keepsake. */
export const OLIVE_BORDER: ThemeBorderSpec = { kind: 'corners', src: branch.src, size: 150, inset: 0 };

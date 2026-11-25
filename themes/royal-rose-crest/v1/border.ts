import type { ThemeBorderSpec } from '@/theme-sdk';
import corner from './assets/corner.webp';

/** Gold acanthus flourishes in the top-right and bottom-left corners: the same on the invitation, the card and the keepsake. */
export const CREST_BORDER: ThemeBorderSpec = { kind: 'corners', src: corner.src, size: 96, inset: 6 };

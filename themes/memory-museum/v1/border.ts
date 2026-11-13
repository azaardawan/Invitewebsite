import type { ThemeBorderSpec } from '@/theme-sdk';
import corner from './assets/corner.svg';

/** A gilt picture frame's corner (a double line and a small diamond), top right and turned in the bottom left. */
export const FRAME_BORDER: ThemeBorderSpec = { kind: 'corners', src: corner.src, size: 26, inset: 6 };

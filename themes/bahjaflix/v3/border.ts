import type { ThemeBorderSpec } from '@/theme-sdk';
import corner from './assets/corner.svg';

/** A camera's red framing corners (top right, and turned in the bottom left) around the title page's hero. */
export const FRAME_BORDER: ThemeBorderSpec = { kind: 'corners', src: corner.src, size: 30, inset: 10 };

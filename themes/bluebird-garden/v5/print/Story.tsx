import type { PrintExtraProps } from '@/theme-sdk';
import { StoryDesign, designData } from '../designs';

/** The Instagram story (1080 × 1920): the announcement's opening page. */
export default function Story(p: PrintExtraProps) {
  return <StoryDesign d={designData(p)} variant="story" />;
}

import type { PrintCardProps } from '@/theme-sdk';
import { StoryDesign, designData } from '../designs';
import styles from '../design.module.css';

/** A5 card front, the owner's card design: fills trim + 3 mm bleed (154 × 216 mm). No QR code (no online invitation). */
export default function Card(p: PrintCardProps) {
  return (
    <div className={styles.cardBox}>
      <StoryDesign d={designData(p)} variant="card" />
    </div>
  );
}

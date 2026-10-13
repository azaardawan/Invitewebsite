import type { PrintCardBackProps } from '@/theme-sdk';
import { CardBackDesign, designData } from '../designs';
import styles from '../design.module.css';

/** A5 card back, landscape (216 × 154 mm with bleed), in the front's paper, flowers and blue glass. */
export default function CardBack(p: PrintCardBackProps) {
  return (
    <div className={styles.backBox}>
      <CardBackDesign d={designData(p)} title={p.title} message={p.message} />
    </div>
  );
}

import type { PrintCardBackProps } from '@/theme-sdk';
import { CardBackDesign, designData } from '../designs';
import styles from '../design.module.css';

/** A5 card back, landscape (216 × 154 mm with bleed), on the front's linen, with its flowers and pink glass. */
export default function CardBack(p: PrintCardBackProps) {
  return (
    <div className={styles.backBox}>
      <CardBackDesign d={designData(p)} title={p.title} message={p.message} />
    </div>
  );
}

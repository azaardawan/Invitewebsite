import type { PrintCardProps } from '@/theme-sdk';
import { StoryDesign, designData } from '../designs';
import styles from '../design.module.css';

/** A5 card front (154 × 216 mm with bleed): the announcement's opening page, with the QR code to the invitation. */
export default function Card(p: PrintCardProps) {
  return (
    <div className={styles.cardBox}>
      <StoryDesign d={designData(p)} variant="card" qr={p.qrDataUrl ? { src: p.qrDataUrl, caption: p.labels.scanToOpen } : null} />
    </div>
  );
}

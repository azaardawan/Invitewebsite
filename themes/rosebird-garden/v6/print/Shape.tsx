import type { PrintShapeProps } from '@/theme-sdk';
import { PosterDesign, designData } from '../designs';

/** The printed posters (feature `card_arch`, manifest `print.shapes`): arch, oval, wavy frame, rounded corners. */
export default function Shape(p: PrintShapeProps) {
  return (
    <PosterDesign
      d={designData(p)}
      shape={p.shape}
      side={p.side}
      widthMm={p.widthMm}
      heightMm={p.heightMm}
      outline={p.outline}
      title={p.title}
      message={p.message}
      qr={p.qrDataUrl ? { src: p.qrDataUrl, caption: p.labels.scanToOpen } : null}
    />
  );
}

import type { PrintExtraProps } from '@/theme-sdk';
import { StickerDesign, designData } from '../designs';

/** One chocolate sticker, in the announcement's art, round or square (the customer's choice). */
export default function Sticker(p: PrintExtraProps) {
  return <StickerDesign d={designData(p)} round={p.shape === 'round'} />;
}

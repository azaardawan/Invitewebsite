import type { PrintExtraProps } from '@/theme-sdk';
import { BottleDesign, designData } from '../designs';

/** One water-bottle label, in the announcement's art, at the bottle size the customer chose. */
export default function Bottle(p: PrintExtraProps) {
  return <BottleDesign d={designData(p)} />;
}

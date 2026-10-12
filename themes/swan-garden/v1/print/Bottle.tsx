import type { PrintExtraProps } from '@/theme-sdk';
import { BottleDesign, designData } from '../designs';

/** One water-bottle label, the owner's design at the bottle size the customer chose. */
export default function Bottle(p: PrintExtraProps) {
  return <BottleDesign d={designData(p)} />;
}

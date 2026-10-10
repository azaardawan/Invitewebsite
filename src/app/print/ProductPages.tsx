import { BottleLabel, BottleSheet, PRODUCT_SIZES, StickerSheet, StoryPage, Sticker, type ProductData } from '@/components/print/Products';
import type { ProductView } from '@/server/documents/tokens';

const BASE = 'html,body{margin:0;padding:0;background:transparent}';

/** One newborn extra as Chromium prints or pictures it, at its real page size. */
export function ProductPages({ view, data }: { view: ProductView; data: ProductData }) {
  const { story, sticker, bottle } = PRODUCT_SIZES;
  const page: Record<ProductView, string> = {
    story: `${story.width}px ${story.height}px`,
    sticker: `${sticker.mm}mm ${sticker.mm}mm`,
    stickerSheet: 'A4',
    bottle: `${bottle.width}mm ${bottle.height}mm`,
    bottleSheet: 'A4 landscape',
  };
  return (
    <>
      <style>{`@page{size:${page[view]};margin:0}${BASE}`}</style>
      {view === 'story' ? <StoryPage d={data} /> : null}
      {view === 'sticker' ? <Sticker d={data} /> : null}
      {view === 'stickerSheet' ? <StickerSheet d={data} /> : null}
      {view === 'bottle' ? <BottleLabel d={data} /> : null}
      {view === 'bottleSheet' ? <BottleSheet d={data} /> : null}
    </>
  );
}

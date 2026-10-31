import type React from 'react';
import { BottleLabel, BottleSheet, PRODUCT_SIZES, StickerSheet, StoryPage, Sticker, Watermark, bottleDims, type ProductData } from '@/components/print/Products';
import type { ProductView } from '@/server/documents/tokens';
import { printComponents } from '@/theme-registry/print.generated';
import type { PrintExtraProps } from '@/theme-sdk/print';
import { COLLAGES, Collage, type CollageKind, type PrintCollageProps } from '@/theme-sdk/collage';
import { POSTER_SIZES, type PrintPosterProps } from '@/theme-sdk/poster';

const BASE = 'html,body{margin:0;padding:0;background:transparent}';

type Extra = 'story' | 'sticker' | 'bottle';

/**
 * One newborn extra as Chromium prints or pictures it, at its real page size. A design that ships its own
 * extra (print/Story.tsx, Sticker.tsx, Bottle.tsx) draws it, unless the owner uploaded artwork for that
 * extra in Admin; otherwise the platform draws it on the shared look.
 */
export async function ProductPages({ view, data }: { view: ProductView; data: ProductData }) {
  const { story, sticker } = PRODUCT_SIZES;
  const bottle = bottleDims(data.bottleSize);
  const page: Record<ProductView, string> = {
    story: `${story.width}px ${story.height}px`,
    sticker: `${sticker.mm}mm ${sticker.mm}mm`,
    stickerSheet: 'A4',
    bottle: `${bottle.width}mm ${bottle.height}mm`,
    bottleSheet: 'A4 landscape',
    collagePolaroids: `${COLLAGE_BOX.polaroids.width}px ${COLLAGE_BOX.polaroids.height}px`,
    collageStory: `${COLLAGE_BOX.story.width}px ${COLLAGE_BOX.story.height}px`,
    collageWall: `${COLLAGE_BOX.wall.width}px ${COLLAGE_BOX.wall.height}px`,
    posterLandscape: `${POSTER_SIZES.landscape.width}px ${POSTER_SIZES.landscape.height}px`,
    posterPortrait: `${POSTER_SIZES.portrait.width}px ${POSTER_SIZES.portrait.height}px`,
  };
  const own = await themeExtras(data);
  return (
    <>
      <style>{`@page{size:${page[view]};margin:0}${BASE}`}</style>
      {view === 'story' ? own.story ? <OwnExtra d={data} item="story" Draw={own.story} /> : <StoryPage d={data} /> : null}
      {view === 'sticker' ? own.sticker ? <OwnExtra d={data} item="sticker" Draw={own.sticker} /> : <Sticker d={data} /> : null}
      {view === 'stickerSheet' ? <StickerSheet d={data} sticker={own.sticker ? (d) => <OwnExtra d={d} item="sticker" Draw={own.sticker!} cutLine /> : undefined} /> : null}
      {view === 'bottle' ? own.bottle ? <OwnExtra d={data} item="bottle" Draw={own.bottle} /> : <BottleLabel d={data} /> : null}
      {view === 'bottleSheet' ? <BottleSheet d={data} label={own.bottle ? (d) => <OwnExtra d={d} item="bottle" Draw={own.bottle!} cutLine /> : undefined} /> : null}
      {view === 'posterLandscape' || view === 'posterPortrait' ? <PosterPage d={data} orientation={view === 'posterLandscape' ? 'landscape' : 'portrait'} /> : null}
      {view in COLLAGE_VIEWS ? <CollagePage d={data} kind={COLLAGE_VIEWS[view as keyof typeof COLLAGE_VIEWS]} Draw={await themeCollage(data)} /> : null}
    </>
  );
}

type Draw = React.ComponentType<PrintExtraProps>;

const COLLAGE_VIEWS = { collagePolaroids: 'polaroids', collageStory: 'story', collageWall: 'wall' } as const satisfies Partial<Record<ProductView, CollageKind>>;
/** Each collage's page: its artwork's box in whole CSS px (render.ts pictures it at print size). */
const COLLAGE_BOX = {
  polaroids: { width: 842, height: 1190 },
  story: { width: COLLAGES.story.width, height: COLLAGES.story.height },
  wall: { width: 567, height: 850 },
} as const satisfies Record<CollageKind, { width: number; height: number }>;

/** The design's own collage (print/Collage.tsx: `<Collage>` in its fonts), or null for the platform's. */
async function themeCollage(d: ProductData): Promise<React.ComponentType<PrintCollageProps> | null> {
  const load = d.theme ? printComponents[d.theme.codeRef]?.collage : undefined;
  return load ? (await load()).default : null;
}

/** A photo collage in its box, with the watermark before payment. */
function CollagePage({ d, kind, Draw }: { d: ProductData; kind: CollageKind; Draw: React.ComponentType<PrintCollageProps> | null }) {
  const props: PrintCollageProps = { kind, locale: d.locale, dir: d.dir, lang: d.lang, ...d.collage };
  return (
    <div dir={d.dir} lang={d.lang} data-extra={`collage-${kind}`} style={{ position: 'relative', width: `${COLLAGE_BOX[kind].width}px`, height: `${COLLAGE_BOX[kind].height}px`, overflow: 'hidden' }}>
      {Draw ? <Draw {...props} /> : <Collage {...props} />}
      {d.watermark ? <Watermark labels={d.labels} /> : null}
    </div>
  );
}

/** A couple poster, drawn by the design (print/Poster.tsx) in its box, with the watermark before payment. */
async function PosterPage({ d, orientation }: { d: ProductData; orientation: PrintPosterProps['orientation'] }) {
  const load = d.theme ? printComponents[d.theme.codeRef]?.poster : undefined;
  if (!load || !d.poster) return null;
  const Draw = (await load()).default;
  const size = POSTER_SIZES[orientation];
  return (
    <div dir={d.dir} lang={d.lang} data-extra={`poster-${orientation}`} style={{ position: 'relative', width: `${size.width}px`, height: `${size.height}px`, overflow: 'hidden' }}>
      <Draw {...d.poster} {...d.poster.picks[orientation]} orientation={orientation} size={size} />
      {d.watermark ? <Watermark labels={d.labels} /> : null}
    </div>
  );
}

/** The design's own extras, for those without owner artwork in Admin. */
async function themeExtras(d: ProductData): Promise<Partial<Record<Extra, Draw>>> {
  const loaders = d.theme ? printComponents[d.theme.codeRef] : undefined;
  if (!loaders) return {};
  const out: Partial<Record<Extra, Draw>> = {};
  for (const item of ['story', 'sticker', 'bottle'] as const) {
    const load = loaders[item];
    if (load && !d.design[item]?.src) out[item] = (await load()).default;
  }
  return out;
}

/** A design-drawn extra in its exact box (a size container), clipped to its shape, with the watermark before payment. */
function OwnExtra({ d, item, Draw, cutLine = false }: { d: ProductData; item: Extra; Draw: Draw; cutLine?: boolean }) {
  const size: PrintExtraProps['size'] =
    item === 'story'
      ? { width: PRODUCT_SIZES.story.width, height: PRODUCT_SIZES.story.height, unit: 'px' }
      : item === 'sticker'
        ? { width: PRODUCT_SIZES.sticker.mm, height: PRODUCT_SIZES.sticker.mm, unit: 'mm' }
        : { ...bottleDims(d.bottleSize), unit: 'mm' };
  const round = item === 'sticker' && d.stickerShape === 'round';
  return (
    <div
      dir={d.dir}
      lang={d.lang}
      data-extra={item}
      style={{
        position: 'relative',
        width: `${size.width}${size.unit}`,
        height: `${size.height}${size.unit}`,
        overflow: 'hidden',
        containerType: 'size',
        borderRadius: round ? '50%' : item === 'sticker' ? '3mm' : undefined,
        outline: cutLine ? '0.2mm solid #c9c2bd' : undefined,
        outlineOffset: '-0.1mm',
      }}
    >
      <Draw {...d.theme!.props} shape={d.stickerShape} size={size} />
      {d.watermark ? <Watermark labels={d.labels} compact={item !== 'story'} /> : null}
    </div>
  );
}

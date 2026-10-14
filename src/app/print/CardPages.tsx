import type React from 'react';
import type { cardData } from '@/server/documents/data';
import { printComponents } from '@/theme-registry/print.generated';
import { DefaultCardBack } from '@/components/print/DefaultCardBack';
import { ArtworkCardBack, ArtworkCardFront, DefaultCardFront } from '@/components/print/ArtworkCard';
import { Watermark } from '@/components/print/Products';
import { SHAPE_MARGIN_MM } from '@/server/documents/data';
import type { PrintShapeProps } from '@/theme-sdk/print';

type CardData = Awaited<ReturnType<typeof cardData>>;

const BASE = 'html,body{margin:0;padding:0;background:#fff}';

/**
 * Both sides of the printable card, as Chromium prints them: the front (portrait), then the back (landscape,
 * its own @page size). Each side is the owner's artwork when set in Admin, otherwise the theme's own design
 * (the back falls back to the platform's simple back). `view` prints one side only (the PDF joins them; each
 * side is also a picture on the receipt). The Admin card preview uses the same component with sample data.
 */
export async function CardPages({
  codeRef,
  data,
  view,
  watermark = null,
  png = false,
}: {
  codeRef: string;
  data: CardData;
  view?: 'front' | 'back';
  /** Before payment the card is only previewed, with a watermark on each side. */
  watermark?: { watermark: string; watermarkNote: string } | null;
  /** Shaped cards: just the shape on a transparent page, for the PNG. */
  png?: boolean;
}) {
  const loaders = printComponents[codeRef];
  if (data.shape && loaders?.shape) {
    const Shape = (await loaders.shape()).default;
    return <ShapePages Shape={Shape} data={data} shape={data.shape} view={view} watermark={watermark} png={png} />;
  }
  const Card = !data.design.front && loaders?.card ? (await loaders.card()).default : null;
  const Back = !data.design.back && loaders?.cardBack ? (await loaders.cardBack()).default : null;
  const crop = data.page.cropMm;
  const vars = colorVars(data.props.colors);
  // Themes draw trim + bleed; for the exact-A5 pages the bleed is cropped evenly on every side.
  const frontSide = data.design.front ? (
    <ArtworkCardFront {...data.props} design={data.design.front} sheet={data.sheet} />
  ) : (
    Card ? (
      <div style={{ margin: crop ? `-${crop}mm` : undefined }}>
        <Card {...data.props} />
      </div>
    ) : (
      // No printable front of its own and no artwork: the platform's simple front.
      <DefaultCardFront {...data.props} sheet={data.sheet} look={data.look} />
    )
  );
  const mark = watermark ? <Watermark labels={watermark} /> : null;
  const front = { width: data.page.width, height: data.page.height, overflow: 'hidden', position: 'relative' } as const;
  const backSheet = { width: data.backPage.width, height: data.backPage.height, overflow: 'hidden', position: 'relative' } as const;
  const backSide = (
    <div style={{ ...vars, page: view === 'back' ? undefined : 'back' } as React.CSSProperties}>
      <div style={backSheet}>
        {data.design.back ? (
          <ArtworkCardBack {...data.back} design={data.design.back} sheet={data.sheet} />
        ) : Back ? (
          <div style={{ margin: crop ? `-${crop}mm` : undefined }}>
            <Back {...data.back} />
          </div>
        ) : (
          <DefaultCardBack {...data.back} look={data.look} />
        )}
        {mark}
      </div>
    </div>
  );

  if (view === 'front') {
    return (
      <>
        <style>{`@page{size:${data.page.width} ${data.page.height};margin:0}${BASE}`}</style>
        <div style={vars}>
          <div style={front}>
            {frontSide}
            {mark}
          </div>
        </div>
      </>
    );
  }
  if (view === 'back') {
    // The theme's front stays in the page but takes no room, so its border (drawn `fixed` by <ThemeBorder>)
    // frames the back exactly as in the PDF.
    return (
      <>
        <style>{`@page{size:${data.backPage.width} ${data.backPage.height};margin:0}${BASE}`}</style>
        {Card ? (
          <div aria-hidden style={{ ...vars, height: 0, overflow: 'hidden' }}>
            <Card {...data.props} />
          </div>
        ) : null}
        {backSide}
      </>
    );
  }
  return (
    <>
      <style>{`@page{size:${data.page.width} ${data.page.height};margin:0}@page back{size:${data.backPage.width} ${data.backPage.height};margin:0}${BASE}`}</style>
      <div style={{ ...vars, breakAfter: 'page' }}>
        <div style={front}>
            {frontSide}
            {mark}
          </div>
      </div>
      {backSide}
    </>
  );
}

type ShapeSheet = NonNullable<CardData['shape']>;

/** The cut line for print shops: a thin magenta line exactly on the shape's outline (commonly called CutContour). */
const CUT_COLOR = '#ec008c';

/**
 * A shaped card (leaf, heart…): each side on a page with a margin around the shape (the print-shop file adds
 * the cut line), or for the PNG just the shape on a transparent page. The back is the front's outline mirrored.
 */
function ShapePages({
  Shape,
  data,
  shape,
  view,
  watermark,
  png,
}: {
  Shape: React.ComponentType<PrintShapeProps>;
  data: CardData;
  shape: ShapeSheet;
  view?: 'front' | 'back';
  watermark: { watermark: string; watermarkNote: string } | null;
  png: boolean;
}) {
  const vars = colorVars(data.props.colors);
  const mark = watermark ? <Watermark labels={watermark} /> : null;
  const box = { width: `${shape.widthMm}mm`, height: `${shape.heightMm}mm` };
  const page = png ? box : shape.page;
  const side = (s: 'front' | 'back') => {
    const outline = shape.outline[s];
    const props: PrintShapeProps = {
      ...(s === 'front' ? data.props : data.back),
      shape: shape.key,
      side: s,
      widthMm: shape.widthMm,
      heightMm: shape.heightMm,
      outline,
      qrDataUrl: data.props.qrDataUrl,
      extraLine: s === 'front' ? data.props.extraLine : null,
      title: data.back.title,
      message: data.back.message,
    };
    return (
      <div data-card-side={s} style={{ ...vars, position: 'relative', ...page, overflow: 'hidden', breakAfter: 'page' }}>
        <div style={{ position: 'absolute', left: png ? 0 : `${SHAPE_MARGIN_MM}mm`, top: png ? 0 : `${SHAPE_MARGIN_MM}mm`, ...box }}>
          <Shape {...props} />
          {shape.cutLine && !png ? (
            <svg
              viewBox={`0 0 ${shape.widthMm} ${shape.heightMm}`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
              aria-hidden
            >
              <path d={outline} fill="none" stroke={CUT_COLOR} strokeWidth={0.1} />
            </svg>
          ) : null}
        </div>
        {mark}
      </div>
    );
  };
  const background = png ? 'html,body{margin:0;padding:0;background:transparent}' : BASE;
  return (
    <>
      <style>{`@page{size:${page.width} ${page.height};margin:0}${background}`}</style>
      {view !== 'back' ? side('front') : null}
      {view !== 'front' ? side('back') : null}
    </>
  );
}

/** The theme's colour slots as CSS variables (`--bahja-color-<key>`), as around the online invitation. */
export function colorVars(colors: Record<string, string>) {
  return Object.fromEntries(Object.entries(colors).map(([k, v]) => [`--bahja-color-${k}`, v])) as React.CSSProperties;
}

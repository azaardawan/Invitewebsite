import type React from 'react';
import { notFound } from 'next/navigation';
import type { cardData } from '@/server/documents/data';
import { printComponents } from '@/theme-registry/print.generated';
import { DefaultCardBack } from '@/components/print/DefaultCardBack';
import { ArtworkCardBack, ArtworkCardFront } from '@/components/print/ArtworkCard';

type CardData = Awaited<ReturnType<typeof cardData>>;

const BASE = 'html,body{margin:0;padding:0;background:#fff}';

/**
 * Both sides of the printable card, as Chromium prints them: the front (portrait), then the back (landscape,
 * its own @page size). Each side is the owner's artwork when set in Admin, otherwise the theme's own design
 * (the back falls back to the platform's simple back). `view` prints one side only (the PDF joins them; each
 * side is also a picture on the receipt). The Admin card preview uses the same component with sample data.
 */
export async function CardPages({ codeRef, data, view }: { codeRef: string; data: CardData; view?: 'front' | 'back' }) {
  const loaders = printComponents[codeRef];
  const Card = !data.design.front && loaders?.card ? (await loaders.card()).default : null;
  if (!data.design.front && !Card) notFound();
  const Back = !data.design.back && loaders?.cardBack ? (await loaders.cardBack()).default : null;
  const crop = data.page.cropMm;
  const vars = colorVars(data.props.colors);
  // Themes draw trim + bleed; for the exact-A5 pages the bleed is cropped evenly on every side.
  const frontSide = data.design.front ? (
    <ArtworkCardFront {...data.props} design={data.design.front} sheet={data.sheet} />
  ) : (
    <div style={{ margin: crop ? `-${crop}mm` : undefined }}>{Card ? <Card {...data.props} /> : null}</div>
  );
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
          <DefaultCardBack {...data.back} />
        )}
      </div>
    </div>
  );

  if (view === 'front') {
    return (
      <>
        <style>{`@page{size:${data.page.width} ${data.page.height};margin:0}${BASE}`}</style>
        <div style={vars}>
          <div style={front}>{frontSide}</div>
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
        <div style={front}>{frontSide}</div>
      </div>
      {backSide}
    </>
  );
}

/** The theme's colour slots as CSS variables (`--bahja-color-<key>`), as around the online invitation. */
export function colorVars(colors: Record<string, string>) {
  return Object.fromEntries(Object.entries(colors).map(([k, v]) => [`--bahja-color-${k}`, v])) as React.CSSProperties;
}

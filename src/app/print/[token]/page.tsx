import type React from 'react';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { invitations } from '@/server/db/schema';
import { verifyPrintToken } from '@/server/documents/tokens';
import { printData } from '@/server/documents/data';
import { printComponents } from '@/theme-registry/print.generated';
import type { KeepsakeProps, PrintCardProps } from '@/theme-sdk/print';
import { DefaultCardBack } from '@/components/print/DefaultCardBack';
import { invitationRenderData } from '@/server/invitation/load';
import { invitationMessages } from '@/server/invitation/theme-props';
import { InvitationView } from '@/components/invitation/InvitationView';

export const dynamic = 'force-dynamic';

/**
 * Internal print page, opened only by the PDF renderer with a short-lived
 * signed token (see src/server/documents). Renders the theme's print
 * companion at its exact page size.
 */
export default async function PrintPage({ params, searchParams }: PageProps<'/print/[token]'>) {
  const { token } = await params;
  // Cards: `view=front` / `view=back` print one side (the PDF joins them; the back is also the receipt's
  // picture). Without it both sides are shown, for checking by eye.
  const view = (await searchParams).view;
  const onlyBack = view === 'back';
  const onlyFront = view === 'front';
  const claim = verifyPrintToken(decodeURIComponent(token));
  if (!claim) notFound();
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, claim.invitationId));
  if (!inv) notFound();
  if (claim.kind === 'og') {
    // The live invitation's cover as a guest first sees it, for the link-preview picture (no analytics).
    const { codeRef, props } = await invitationRenderData(db(), inv, 'live');
    const msgs = invitationMessages(inv.locale);
    return <InvitationView codeRef={codeRef} props={props} ribbon={null} errorText={{ message: msgs.renderError, retry: msgs.retry }} />;
  }
  const data = await printData(db(), inv, claim.kind);
  const loaders = printComponents[data.codeRef];
  const base = 'html,body{margin:0;padding:0;background:#fff}';
  // Keepsake: every A4 page edge to edge (no page margins), so the theme's border sits in the same place on
  // the cover and every message page; the theme spaces its messages with padding (box-decoration-break: clone).
  const pageCss =
    data.kind === 'keepsake'
      ? `@page{size:A4;margin:0}${base}`
      : `@page{size:${data.page.width} ${data.page.height};margin:${data.page.margin}}${base}`;

  if (data.kind === 'card') {
    if (!loaders?.card) notFound();
    const Card = (await loaders.card()).default;
    const Back = loaders.cardBack ? (await loaders.cardBack()).default : null;
    const crop = data.page.cropMm;
    // Two pages: the front (portrait), then the back (landscape, its own @page size). Themes draw trim +
    // bleed; for the exact-A5 pages the bleed is cropped evenly on every side. The default back fills its page.
    const cardCss = `@page{size:${data.page.width} ${data.page.height};margin:0}@page back{size:${data.backPage.width} ${data.backPage.height};margin:0}${base}`;
    const front = { width: data.page.width, height: data.page.height, overflow: 'hidden', position: 'relative' } as const;
    const backSheet = { width: data.backPage.width, height: data.backPage.height, overflow: 'hidden', position: 'relative' } as const;
    const backSide = (
      <div style={{ ...colorVars(data.props.colors), page: onlyBack ? undefined : 'back' } as React.CSSProperties}>
        <div style={backSheet}>
          {Back ? (
            <div style={{ margin: crop ? `-${crop}mm` : undefined }}>
              <Back {...data.back} />
            </div>
          ) : (
            <DefaultCardBack {...data.back} />
          )}
        </div>
      </div>
    );
    if (onlyFront) {
      return (
        <>
          <style>{`@page{size:${data.page.width} ${data.page.height};margin:0}${base}`}</style>
          <div style={colorVars(data.props.colors)}>
            <div style={front}>
              <div style={{ margin: crop ? `-${crop}mm` : undefined }}>
                <Card {...(data.props as PrintCardProps)} />
              </div>
            </div>
          </div>
        </>
      );
    }
    if (onlyBack) {
      // The front stays in the page but takes no room, so its border (drawn `fixed` by <ThemeBorder>)
      // frames the back exactly as in the PDF.
      return (
        <>
          <style>{`@page{size:${data.backPage.width} ${data.backPage.height};margin:0}${base}`}</style>
          <div aria-hidden style={{ ...colorVars(data.props.colors), height: 0, overflow: 'hidden' }}>
            <Card {...(data.props as PrintCardProps)} />
          </div>
          {backSide}
        </>
      );
    }
    return (
      <>
        <style>{cardCss}</style>
        <div style={{ ...colorVars(data.props.colors), breakAfter: 'page' }}>
          <div style={front}>
            <div style={{ margin: crop ? `-${crop}mm` : undefined }}>
              <Card {...(data.props as PrintCardProps)} />
            </div>
          </div>
        </div>
        {backSide}
      </>
    );
  }
  if (!loaders?.keepsake) notFound();
  const Keepsake = (await loaders.keepsake()).default;
  return (
    <>
      <style>{pageCss}</style>
      <div style={colorVars(data.props.colors)}>
        <Keepsake {...(data.props as KeepsakeProps)} />
      </div>
    </>
  );
}

/** The theme's colour slots as CSS variables (`--bahja-color-<key>`), as around the online invitation. */
function colorVars(colors: Record<string, string>) {
  return Object.fromEntries(Object.entries(colors).map(([k, v]) => [`--bahja-color-${k}`, v])) as React.CSSProperties;
}

import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { invitations } from '@/server/db/schema';
import { PRODUCT_VIEWS, verifyPrintToken, type ProductView } from '@/server/documents/tokens';
import { ProductPages } from '../ProductPages';
import { isPaid, productData } from '@/server/products/data';
import { printData } from '@/server/documents/data';
import { printComponents } from '@/theme-registry/print.generated';
import type { KeepsakeProps } from '@/theme-sdk/print';
import { CardPages, colorVars } from '../CardPages';
import { invitationRenderData } from '@/server/invitation/load';
import { invitationMessages } from '@/server/invitation/theme-props';
import { InvitationView } from '@/components/invitation/InvitationView';
import { KeepsakeSignatures } from '@/components/print/KeepsakeSignatures';
import { BoardPrint } from '@/components/board/BoardPrint';
import { WatermarkLayer } from '@/components/print/watermark';
import { boardView } from '@/server/board/data';
import { MAX_BOARDS } from '@/catalog/signature-board';
import { TextOverrides } from '@/components/invitation/TextOverrides';

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
  const sp = await searchParams;
  const view = sp.view;
  const claim = verifyPrintToken(decodeURIComponent(token));
  if (!claim) notFound();
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, claim.invitationId));
  if (!inv) notFound();
  if (claim.kind === 'og') {
    // The live invitation's cover as a guest first sees it, for the link-preview picture (no analytics).
    const { codeRef, props } = await invitationRenderData(db(), inv, 'live');
    const msgs = invitationMessages(inv.locale);
    return (
      <>
        <InvitationView codeRef={codeRef} props={props} ribbon={null} errorText={{ message: msgs.renderError, retry: msgs.retry }} />
        <TextOverrides overrides={inv.textOverrides} />
      </>
    );
  }
  if (claim.kind === 'board') {
    // The signature board: board `n` (0 = the first) at its printed size, watermarked until paid.
    const view = await boardView(db(), inv);
    if (!view) notFound();
    const n = Math.max(0, Math.min(MAX_BOARDS - 1, Number(sp.n) || 0));
    const { widthMm, heightMm } = view.design;
    return (
      <>
        <style>{`@page{size:${widthMm}mm ${heightMm}mm;margin:0}html,body{margin:0;padding:0;background:#fff}`}</style>
        <div style={{ position: 'relative', width: `${widthMm}mm`, height: `${heightMm}mm`, overflow: 'hidden' }} data-board-page="">
          <BoardPrint view={view} board={n} />
          {isPaid(inv) ? null : <WatermarkLayer text={await watermarkLabels(inv.locale)} />}
        </div>
        <TextOverrides overrides={inv.textOverrides} />
      </>
    );
  }
  if ((PRODUCT_VIEWS as readonly string[]).includes(claim.kind)) {
    // `shape=square`: the square sticker set of a customer who chose both shapes.
    const shape = sp.shape === 'square' && inv.stickerShape === 'both' ? 'square' : undefined;
    return (
      <>
        <ProductPages view={claim.kind as ProductView} data={await productData(db(), inv, { stickerShape: shape })} />
        <TextOverrides overrides={inv.textOverrides} />
      </>
    );
  }
  // `card=`: which of the customer's printed cards (the A5 card or a shape they ticked); without it, their first.
  const data = await printData(db(), inv, claim.kind, { card: typeof sp.card === 'string' ? sp.card : null });
  // `png=1` (shaped cards): only the shape, on a transparent page, for the PNG picture.
  if (data.kind === 'card')
    return (
      <>
        <CardPages
          codeRef={data.codeRef}
          data={data}
          view={view === 'front' || view === 'back' ? view : undefined}
          png={sp.png === '1'}
          watermark={isPaid(inv) ? null : await watermarkLabels(inv.locale)}
        />
        <TextOverrides overrides={inv.textOverrides} />
      </>
    );
  const loaders = printComponents[data.codeRef];
  // Keepsake: every A4 page edge to edge (no page margins), so the theme's border sits in the same place on
  // the cover and every message page; the theme spaces its messages with padding (box-decoration-break: clone).
  const pageCss = `@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#fff}`;
  if (!loaders?.keepsake) notFound();
  const Keepsake = (await loaders.keepsake()).default;
  return (
    <>
      <style>{pageCss}</style>
      <div style={colorVars(data.props.colors)}>
        <Keepsake {...(data.props as KeepsakeProps)} />
      </div>
      {/* Guests' signatures under their names, in every design (frozen versions too). */}
      <KeepsakeSignatures items={(data.props as KeepsakeProps).messages.map((m) => ({ guestName: m.guestName, name: m.name, signature: m.signature }))} />
      <TextOverrides overrides={inv.textOverrides} />
    </>
  );
}


/** The watermark wording (before payment) in the invitation's language. */
async function watermarkLabels(locale: Parameters<typeof invitationMessages>[0]) {
  const { print } = invitationMessages(locale) as unknown as { print: { watermark: string; watermarkNote: string } };
  return { watermark: print.watermark, watermarkNote: print.watermarkNote };
}

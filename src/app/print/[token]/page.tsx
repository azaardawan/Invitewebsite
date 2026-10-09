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
  if ((PRODUCT_VIEWS as readonly string[]).includes(claim.kind)) {
    return <ProductPages view={claim.kind as ProductView} data={await productData(db(), inv)} />;
  }
  const data = await printData(db(), inv, claim.kind);
  if (data.kind === 'card') return <CardPages codeRef={data.codeRef} data={data} view={view === 'front' || view === 'back' ? view : undefined} watermark={isPaid(inv) ? null : await watermarkLabels(inv.locale)} />;
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
    </>
  );
}


/** The watermark wording (before payment) in the invitation's language. */
async function watermarkLabels(locale: Parameters<typeof invitationMessages>[0]) {
  const { print } = invitationMessages(locale) as unknown as { print: { watermark: string; watermarkNote: string } };
  return { watermark: print.watermark, watermarkNote: print.watermarkNote };
}

import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { invitations } from '@/server/db/schema';
import { verifyPrintToken } from '@/server/documents/tokens';
import { printData } from '@/server/documents/data';
import { printComponents } from '@/theme-registry/print.generated';
import type { KeepsakeProps, PrintCardProps } from '@/theme-sdk/print';

export const dynamic = 'force-dynamic';

/**
 * Internal print page, opened only by the PDF renderer with a short-lived
 * signed token (see src/server/documents). Renders the theme's print
 * companion at its exact page size.
 */
export default async function PrintPage({ params }: PageProps<'/print/[token]'>) {
  const { token } = await params;
  const claim = verifyPrintToken(decodeURIComponent(token));
  if (!claim) notFound();
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, claim.invitationId));
  if (!inv) notFound();
  const data = await printData(db(), inv, claim.kind);
  const loaders = printComponents[data.codeRef];
  const pageCss = `@page{size:${data.page.width} ${data.page.height};margin:${data.page.margin}}html,body{margin:0;padding:0;background:#fff}`;

  if (data.kind === 'card') {
    if (!loaders?.card) notFound();
    const Card = (await loaders.card()).default;
    return (
      <>
        <style>{pageCss}</style>
        <Card {...(data.props as PrintCardProps)} />
      </>
    );
  }
  if (!loaders?.keepsake) notFound();
  const Keepsake = (await loaders.keepsake()).default;
  return (
    <>
      <style>{pageCss}</style>
      <Keepsake {...(data.props as KeepsakeProps)} />
    </>
  );
}

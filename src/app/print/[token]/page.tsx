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
    // Two pages: the front, then the back. The theme draws trim + bleed; for the exact-A5 page the bleed
    // is cropped evenly on every side. The platform's default back simply fills the page.
    const sheet = { width: data.page.width, height: data.page.height, overflow: 'hidden', position: 'relative' } as const;
    return (
      <>
        <style>{pageCss}</style>
        <div style={{ ...colorVars(data.props.colors), breakAfter: 'page' }}>
          <div style={sheet}>
            <div style={{ margin: crop ? `-${crop}mm` : undefined }}>
              <Card {...(data.props as PrintCardProps)} />
            </div>
          </div>
        </div>
        <div style={colorVars(data.props.colors)}>
          <div style={sheet}>
            {Back ? (
              <div style={{ margin: crop ? `-${crop}mm` : undefined }}>
                <Back {...data.back} />
              </div>
            ) : (
              <DefaultCardBack {...data.back} />
            )}
          </div>
        </div>
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

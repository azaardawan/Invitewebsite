import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { invitations, themeVersions } from '@/server/db/schema';
import { readRenderToken } from '@/server/kit/token';
import { buildKitProps } from '@/server/kit/props';
import { sheetLayout } from '@/catalog/kit';
import { isDesignKit } from '@/theme-registry';
import { KitUnit } from '@/components/kit/KitUnit';
import { KitSheet } from '@/components/kit/KitSheet';
import { KitReady } from '@/components/kit/KitReady';

/**
 * The page the file generator's headless browser prints or screenshots.
 * Reachable only with a short-lived token signed by the server for a download
 * that was already authorized (receipt token or admin), so it grants nothing new.
 */
export default async function KitRenderPage({ params }: PageProps<'/k/[token]'>) {
  await connection();
  const { token } = await params;
  const job = readRenderToken(token);
  if (!job) notFound();
  const [row] = await db()
    .select({ inv: invitations, codeRef: themeVersions.codeRef })
    .from(invitations)
    .innerJoin(themeVersions, eq(themeVersions.id, invitations.themeVersionId))
    .where(eq(invitations.id, job.invitationId));
  if (!row || !isDesignKit(row.codeRef)) notFound();
  const props = buildKitProps({
    mode: 'live',
    locale: row.inv.locale,
    themeKey: row.codeRef.split('@')[0]!,
    unit: job.unit,
    fieldKeys: row.inv.fieldKeys,
    values: row.inv.fieldValues,
    options: job.options,
  });
  return (
    <>
      {job.format === 'pdf' && job.unit !== 'story' ? (
        <KitSheet codeRef={row.codeRef} props={props} layout={sheetLayout(job.unit, job.options.bottle)} />
      ) : (
        <KitUnit codeRef={row.codeRef} props={props} clip="trim" />
      )}
      <KitReady />
    </>
  );
}

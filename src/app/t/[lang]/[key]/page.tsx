import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { sections, themes } from '@/server/db/schema';
import { resolveSample } from '@/server/invitation/preview';
import { invitationMessages } from '@/server/invitation/theme-props';
import { isLocale } from '@/i18n/config';
import { manifestByCodeRef } from '@/theme-registry';
import { InvitationView } from '@/components/invitation/InvitationView';

const query = z.object({
  pkg: z.uuid().optional(),
  names: z.enum(['short', 'long']).optional(),
});

/**
 * Public sample of a theme on sale, filled with sample names, embedded on the
 * storefront theme page. Only the current version of ACTIVE themes; the
 * guest form never stores anything here.
 */
export default async function PublicThemeSample({ params, searchParams }: PageProps<'/t/[lang]/[key]'>) {
  await connection();
  const { lang, key } = await params;
  if (!isLocale(lang)) notFound();
  const [live] = await db()
    .select({ id: themes.id })
    .from(themes)
    .innerJoin(sections, eq(sections.id, themes.sectionId))
    .where(and(eq(themes.key, key), eq(themes.status, 'ACTIVE'), eq(sections.status, 'ACTIVE')));
  if (!live) notFound();
  const q = query.safeParse(await searchParams);
  const sample = await resolveSample(db(), { themeKey: key, locale: lang, packageId: q.data?.pkg, names: q.data?.names });
  if (!sample || !manifestByCodeRef(sample.version.codeRef)) notFound();
  const msgs = invitationMessages(lang);
  return (
    <InvitationView
      codeRef={sample.version.codeRef}
      props={sample.props}
      ribbon={msgs.sampleRibbon}
      errorText={{ message: msgs.renderError, retry: msgs.retry }}
    />
  );
}

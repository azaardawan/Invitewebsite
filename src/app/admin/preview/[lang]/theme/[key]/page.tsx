import { notFound } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { resolveSample } from '@/server/invitation/preview';
import { invitationMessages } from '@/server/invitation/theme-props';
import { isLocale } from '@/i18n/config';
import { manifestByCodeRef } from '@/theme-registry';
import { InvitationView } from '@/components/invitation/InvitationView';

const query = z.object({
  v: z.coerce.number().int().min(1).optional(),
  pkg: z.uuid().optional(),
  state: z.coerce.number().int().min(0).max(20).optional(),
  names: z.enum(['short', 'long']).optional(),
});

/**
 * Admin sample preview of any theme version (including ones not yet on sale).
 * Embedded in an iframe on the theme page, and used by automated theme validation.
 */
export default async function ThemeSamplePreview({ params, searchParams }: PageProps<'/admin/preview/[lang]/theme/[key]'>) {
  await requireAdmin({ permission: 'themes.view' });
  const { lang, key } = await params;
  if (!isLocale(lang)) notFound();
  const q = query.safeParse(await searchParams);
  const sample = await resolveSample(db(), {
    themeKey: key,
    locale: lang,
    version: q.data?.v,
    packageId: q.data?.pkg,
    stateIndex: q.data?.state,
    names: q.data?.names,
  });
  if (!sample) notFound();
  // Code for this version must be in the deployed build.
  if (!manifestByCodeRef(sample.version.codeRef)) notFound();
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

import { notFound } from 'next/navigation';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { themePalettes } from '@/server/db/schema';
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
  /** Comma-separated custom combination (used by the automatic theme checks). */
  features: z.string().max(500).optional(),
  fields: z.string().max(500).optional(),
  /** A colour set to try on the theme. */
  palette: z.uuid().optional(),
});

const list = (v: string | undefined) => (v === undefined ? undefined : v.split(',').filter(Boolean));

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
    custom: q.data?.features !== undefined || q.data?.fields !== undefined ? { features: list(q.data?.features) ?? [], fields: list(q.data?.fields) ?? [] } : undefined,
    names: q.data?.names,
    colors: q.data?.palette ? (await db().select({ colors: themePalettes.colors }).from(themePalettes).where(eq(themePalettes.id, q.data.palette)))[0]?.colors : undefined,
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

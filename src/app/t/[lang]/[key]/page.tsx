import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { sections, themePalettes, themes } from '@/server/db/schema';
import { resolveSample } from '@/server/invitation/preview';
import { invitationMessages } from '@/server/invitation/theme-props';
import { isLocale, type Locale } from '@/i18n/config';
import { parseTextProbe } from '@/server/invitation/probe';
import { PreviewRuntime } from '@/components/invitation/PreviewRuntime';
import { manifestByCodeRef } from '@/theme-registry';
import { InvitationView } from '@/components/invitation/InvitationView';

const query = z.object({
  pkg: z.uuid().optional(),
  names: z.enum(['short', 'long']).optional(),
  /** Which occasion's wording, for a design sold in several. */
  occasion: z.string().max(40).optional(),
  /** The customer's live preview while they type (JSON, `parseTextProbe`): their texts instead of the sample's. */
  live: z.string().max(20000).optional(),
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
  if (q.data?.live !== undefined) return <LiveSample themeId={live.id} themeKey={key} lang={lang} pkg={q.data.pkg} occasion={q.data.occasion} live={q.data.live} />;
  const first = await resolveSample(db(), { themeKey: key, locale: lang, packageId: q.data?.pkg, names: q.data?.names, occasion: q.data?.occasion });
  if (!first || !manifestByCodeRef(first.version.codeRef)) notFound();
  // A design may show its sample in its own language and with Kurdish names (manifest `sample`); English stays English.
  const wanted = first.manifest.sample;
  const locale = wanted?.locale && lang !== 'en' ? wanted.locale : lang;
  const sample =
    locale !== lang || wanted?.names === 'kurdish'
      ? ((await resolveSample(db(), { themeKey: key, locale, packageId: q.data?.pkg, names: q.data?.names, occasion: q.data?.occasion, kurdishNames: wanted?.names === 'kurdish' })) ?? first)
      : first;
  const msgs = invitationMessages(locale);
  return (
    <InvitationView
      codeRef={sample.version.codeRef}
      props={sample.props}
      ribbon={msgs.sampleRibbon}
      errorText={{ message: msgs.renderError, retry: msgs.retry }}
    />
  );
}

/**
 * The order form's live preview (owner, 2026-11-26): the design in the invitation's language with the customer's texts
 * so far (the sample's where they haven't written yet), already open. Nothing is stored.
 */
async function LiveSample({ themeId, themeKey, lang, pkg, occasion, live }: { themeId: string; themeKey: string; lang: Locale; pkg?: string; occasion?: string; live: string }) {
  const probe = parseTextProbe(live);
  const colors = probe.palette
    ? (await db().select({ colors: themePalettes.colors }).from(themePalettes).where(and(eq(themePalettes.id, probe.palette), eq(themePalettes.themeId, themeId))))[0]?.colors
    : undefined;
  const sample = await resolveSample(db(), { themeKey, locale: lang, packageId: pkg, occasion, values: probe.values, wording: probe.wording, eventKind: probe.eventKind, eventName: probe.eventName, colors });
  if (!sample || !manifestByCodeRef(sample.version.codeRef)) notFound();
  const msgs = invitationMessages(lang);
  return (
    <>
      <PreviewRuntime openText={sample.props.labels.openInvitation} />
      <InvitationView codeRef={sample.version.codeRef} props={sample.props} ribbon={null} errorText={{ message: msgs.renderError, retry: msgs.retry }} />
    </>
  );
}

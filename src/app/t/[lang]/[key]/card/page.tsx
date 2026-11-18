import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { sections, themes } from '@/server/db/schema';
import { resolveSample } from '@/server/invitation/preview';
import { invitationMessages } from '@/server/invitation/theme-props';
import { cardData, designCards } from '@/server/documents/data';
import { themeCardDesign } from '@/server/catalog/card-design';
import { isLocale } from '@/i18n/config';
import { CardPages } from '@/app/print/CardPages';

const query = z.object({
  /** `a5` (the card) or one of the design's shapes. */
  card: z.string().max(40).default('a5'),
  side: z.enum(['front', 'back']).default('front'),
  names: z.enum(['short', 'long']).optional(),
  occasion: z.string().max(40).optional(),
});

/**
 * Public sample of one side of a design's printed card, with the sample names and the «sample» watermark, for the
 * design page's cards (owner, 2026-11-18). Only designs on sale, only the cards they offer. Never a customer's card.
 */
export default async function PublicCardSample({ params, searchParams }: PageProps<'/t/[lang]/[key]/card'>) {
  await connection();
  const { lang, key } = await params;
  if (!isLocale(lang)) notFound();
  const q = query.safeParse(await searchParams);
  if (!q.success) notFound();
  const [live] = await db()
    .select({ id: themes.id })
    .from(themes)
    .innerJoin(sections, eq(sections.id, themes.sectionId))
    .where(and(eq(themes.key, key), eq(themes.status, 'ACTIVE'), eq(sections.status, 'ACTIVE')));
  if (!live) notFound();
  const sample = await resolveSample(db(), { themeKey: key, locale: lang, names: q.data.names, occasion: q.data.occasion });
  if (!sample) notFound();
  const card = designCards(sample.manifest).find((c) => c.key === q.data.card);
  if (!card) notFound();
  const shape = card.key === 'a5' ? null : (sample.manifest.print?.shapes?.find((s) => s.key === card.key) ?? null);
  const data = await cardData(sample.props, sample.manifest, 'card', {}, null, await themeCardDesign(db(), sample.theme.id), null, shape);
  const { print } = invitationMessages(lang) as unknown as { print: { watermark: string; watermarkNote: string } };
  return <CardPages codeRef={sample.version.codeRef} data={data} view={q.data.side} watermark={{ watermark: print.watermark, watermarkNote: print.watermarkNote }} />;
}

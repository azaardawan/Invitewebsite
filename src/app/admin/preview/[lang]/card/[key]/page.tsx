import { notFound } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { resolveSample } from '@/server/invitation/preview';
import { cardData } from '@/server/documents/data';
import { themeCardDesign } from '@/server/catalog/card-design';
import { isLocale } from '@/i18n/config';
import { manifestByCodeRef } from '@/theme-registry';
import { designCardShapes } from '@/theme-sdk/manifest';
import { CARD_SHAPE_KEYS, type CardShape } from '@/catalog/card-shapes';
import { CardPages } from '@/app/print/CardPages';

const query = z.object({
  side: z.enum(['front', 'back']).default('front'),
  v: z.coerce.number().int().min(1).optional(),
  /** One of the design's card shapes (default its main one). */
  shape: z.enum(CARD_SHAPE_KEYS as [CardShape, ...CardShape[]]).optional(),
  /** `1`: the print-shop file (bleed and, for a cut-out shape, the cutting line). */
  shop: z.literal('1').optional(),
});

/**
 * Admin sample of one side of a theme's printable card (front portrait, back landscape), with the owner's
 * artwork when set: exactly what the PDF prints, with sample names. Embedded on the theme page.
 */
export default async function CardSamplePreview({ params, searchParams }: PageProps<'/admin/preview/[lang]/card/[key]'>) {
  await requireAdmin({ permission: 'themes.view' });
  const { lang, key } = await params;
  if (!isLocale(lang)) notFound();
  const q = query.safeParse(await searchParams);
  if (!q.success) notFound();
  const sample = await resolveSample(db(), { themeKey: key, locale: lang, version: q.data.v });
  if (!sample) notFound();
  const manifest = manifestByCodeRef(sample.version.codeRef);
  if (!manifest) notFound();
  const shapes = designCardShapes(manifest);
  const shape = q.data.shape && shapes.includes(q.data.shape) ? q.data.shape : shapes[0]!;
  // The owner's card artwork is for the main shape; other shapes show the design's own drawing.
  const design = shape === shapes[0] ? await themeCardDesign(db(), sample.theme.id) : { front: null, back: null };
  const data = await cardData(sample.props, manifest, q.data.shop ? 'cardBleed' : 'card', {}, 'https://bahjaaa.com/i/sample', design, null, shape);
  return <CardPages codeRef={sample.version.codeRef} data={data} view={q.data.side} />;
}

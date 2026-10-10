import { notFound } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { resolveSample } from '@/server/invitation/preview';
import { CARD_SIDE_DEFAULTS, themeArtwork } from '@/server/catalog/card-design';
import { productDataFrom } from '@/server/products/data';
import { isLocale } from '@/i18n/config';
import { ProductPages } from '@/app/print/ProductPages';

const query = z.object({
  view: z.enum(['story', 'sticker', 'stickerSheet', 'bottle', 'bottleSheet']).default('story'),
  shape: z.enum(['round', 'square']).default('round'),
  gender: z.enum(['boy', 'girl']).default('boy'),
  /** Try a layout without saving it. */
  layout: z.string().max(20).optional(),
});

/** Admin sample of a newborn extra (story, sticker, bottle label) on the owner's artwork, with sample details. */
export default async function ProductSamplePreview({ params, searchParams }: PageProps<'/admin/preview/[lang]/product/[key]'>) {
  await requireAdmin({ permission: 'themes.view' });
  const { lang, key } = await params;
  if (!isLocale(lang)) notFound();
  const q = query.safeParse(await searchParams);
  if (!q.success) notFound();
  const sample = await resolveSample(db(), { themeKey: key, locale: lang });
  if (!sample) notFound();
  const props = { ...sample.props, fields: { ...sample.props.fields, baby_gender: q.data.gender, baby_name: sample.props.fields.baby_name ?? sample.props.fields.person_1_name } };
  const art = await themeArtwork(db(), sample.theme.id);
  if (q.data.layout) {
    const slot = q.data.view.startsWith('sticker') ? 'sticker' : q.data.view.startsWith('bottle') ? 'bottle' : 'story';
    art[slot] = { ...(art[slot] ?? { src: '', ...CARD_SIDE_DEFAULTS, insetMm: slot === 'sticker' ? 4 : slot === 'bottle' ? 6 : 0 }), layout: q.data.layout };
  }
  const data = productDataFrom(props, art, { stickerShape: q.data.shape, watermark: false });
  return <ProductPages view={q.data.view} data={data} />;
}

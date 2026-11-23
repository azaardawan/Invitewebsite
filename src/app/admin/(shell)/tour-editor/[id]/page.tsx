import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { assets } from '@/server/db/schema';
import { requireAdmin } from '@/server/auth/guard';
import { getTour } from '@/server/tours/tours';
import { TourEditor } from '@/components/admin/TourEditor';

/**
 * The tour's editor (owner, 2026-11-23): the café's 3D model full screen, where the owner picks any item by clicking it
 * (each has a permanent code, "#37") and moves or turns it; saved, visitors see the place as the owner set it.
 */
export default async function TourEditorPage(props: PageProps<'/admin/tour-editor/[id]'>) {
  await requireAdmin({ permission: 'tours.manage' });
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const tour = await getTour(db(), id);
  if (!tour) notFound();
  const t = await getTranslations('admin.tours.editor');
  const [model] = tour.modelAssetId ? await db().select().from(assets).where(eq(assets.id, tour.modelAssetId)) : [];
  if (!model) return <p className="p-8">{t('noModel')}</p>;
  return <TourEditor tourId={tour.id} name={tour.name} model={`/media/${model.storageKey}`} edits={tour.itemEdits ?? {}} />;
}

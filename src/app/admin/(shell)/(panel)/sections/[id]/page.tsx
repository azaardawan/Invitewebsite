import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { assets } from '@/server/db/schema';
import { requireAdmin } from '@/server/auth/guard';
import { getSection } from '@/server/catalog/sections';
import { listFields } from '@/server/catalog/fields';
import { CatalogError, localized } from '@/server/catalog/common';
import { publicMediaUrl } from '@/server/storage';
import { FEATURE_KEYS } from '@/catalog/features';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import { I18nInputs } from '@/components/admin/I18nInputs';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Badge, Card, MoveButtons } from '@/components/admin/bits';
import { listSubsections } from '@/server/catalog/subsections';
import {
  createSubsectionAction,
  moveSubsectionAction,
  sectionDefaultFieldsAction,
  sectionStatusAction,
  subsectionStatusAction,
  updateSectionAction,
  updateSubsectionAction,
} from '@/app/admin/_actions/catalog';

export default async function SectionEditPage({ params }: PageProps<'/admin/sections/[id]'>) {
  await requireAdmin({ permission: 'sections.manage' });
  const { id } = await params;
  const data = await getSection(db(), id).catch((e) => (e instanceof CatalogError ? null : Promise.reject(e)));
  if (!data) notFound();
  const { section, defaultFields } = data;
  const t = await getTranslations('admin.catalog');
  const locale = await getLocale();
  const library = await listFields(db());
  const [image] = section.imageAssetId ? await db().select().from(assets).where(eq(assets.id, section.imageAssetId)) : [];
  const defaults = new Map(defaultFields.map((d) => [d.fieldKey, d]));
  const subs = await listSubsections(db(), section.id);

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/sections" className="text-sm text-muted underline">
        {t('common.back')}
      </Link>
      <h1 className="text-2xl font-semibold">
        {t('sections.edit')}: {localized(section.name, locale)} <span className="text-base text-muted" dir="ltr">({section.key})</span>
      </h1>

      <Card>
        <ActionForm action={updateSectionAction} className="space-y-5">
          <input type="hidden" name="id" value={section.id} />
          <I18nInputs name="name" label={t('sections.name')} defaultValue={section.name} maxLength={60} />
          <I18nInputs name="description" label={t('sections.description')} defaultValue={section.description} required={false} multiline maxLength={300} />
          <ImageUpload name="imageAssetId" label={t('sections.image')} initial={image ? { id: image.id, url: publicMediaUrl(image.storageKey) } : null} />
          <fieldset>
            <legend className="text-sm font-medium">{t('sections.requiredFeatures')}</legend>
            <p className="mb-2 text-xs text-muted">{t('sections.requiredFeaturesHint')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {FEATURE_KEYS.map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="requiredFeatures" value={f} defaultChecked={section.requiredFeatures.includes(f)} />
                  {t(`features.${f}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <SubmitButton>{t('common.save')}</SubmitButton>
        </ActionForm>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t('subsections.title')}</h2>
          <p className="text-sm text-muted">{t('subsections.hint')}</p>
        </div>
        {subs.length === 0 ? <p className="text-sm text-muted">{t('subsections.empty')}</p> : null}
        <ul className="space-y-2">
          {subs.map(({ subsection: sub, themeCount }) => (
            <li key={sub.id} className="rounded-md border border-line p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{localized(sub.name, locale)}</span>
                  <span className="font-mono text-xs text-muted" dir="ltr">
                    {sub.key}
                  </span>
                  <span className="text-xs text-muted">{t('subsections.themeCount', { count: themeCount })}</span>
                  {sub.status === 'ARCHIVED' ? <Badge status="ARCHIVED">{t('subsections.hidden')}</Badge> : null}
                </div>
                {sub.status === 'ACTIVE' ? (
                  <MoveButtons action={moveSubsectionAction} id={sub.id} extra={{ sectionId: section.id }} labels={{ up: t('common.moveUp'), down: t('common.moveDown') }} />
                ) : null}
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-accent">{t('common.edit')}</summary>
                <ActionForm action={updateSubsectionAction} className="mt-3 space-y-4">
                  <input type="hidden" name="id" value={sub.id} />
                  <input type="hidden" name="sectionId" value={section.id} />
                  <I18nInputs name="name" label={t('subsections.name')} defaultValue={sub.name} maxLength={60} />
                  <I18nInputs name="description" label={t('sections.description')} defaultValue={sub.description} required={false} multiline maxLength={300} />
                  <SubmitButton>{t('common.save')}</SubmitButton>
                </ActionForm>
                <ActionForm action={subsectionStatusAction} className="mt-3">
                  <input type="hidden" name="id" value={sub.id} />
                  <input type="hidden" name="sectionId" value={section.id} />
                  <input type="hidden" name="status" value={sub.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'} />
                  <SubmitButton tone={sub.status === 'ACTIVE' ? 'danger' : 'secondary'}>{sub.status === 'ACTIVE' ? t('subsections.hide') : t('subsections.show')}</SubmitButton>
                </ActionForm>
              </details>
            </li>
          ))}
        </ul>
        <details className="rounded-md border border-dashed border-line p-3">
          <summary className="cursor-pointer font-medium text-accent">{t('subsections.add')}</summary>
          <ActionForm action={createSubsectionAction} className="mt-3 space-y-4">
            <input type="hidden" name="sectionId" value={section.id} />
            <div className="max-w-xs">
              <Field label={t('subsections.key')} name="key" dir="ltr" />
              <p className="mt-1 text-xs text-muted">{t('subsections.keyHint')}</p>
            </div>
            <I18nInputs name="name" label={t('subsections.name')} maxLength={60} />
            <SubmitButton>{t('subsections.add')}</SubmitButton>
          </ActionForm>
        </details>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">{t('sections.defaultFields')}</h2>
        <p className="mb-4 text-sm text-muted">{t('sections.defaultFieldsHint')}</p>
        <ActionForm action={sectionDefaultFieldsAction} className="space-y-3">
          <input type="hidden" name="id" value={section.id} />
          {library.map((f, i) => {
            const d = defaults.get(f.key);
            return (
              <div key={f.key} className="rounded-md border border-line p-3">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" name={`df.${f.key}.included`} defaultChecked={Boolean(d)} />
                    {localized(f.label, locale)} <span className="font-mono text-xs text-muted" dir="ltr">{f.key}</span>
                  </label>
                  <div className="w-24">
                    <Field label={t('common.order')} name={`df.${f.key}.order`} type="number" required={false} defaultValue={String(d?.sortOrder ?? 100 + i)} />
                  </div>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-accent">{t('sections.labelOverride')}</summary>
                  <div className="mt-2">
                    <I18nInputs name={`df.${f.key}.label`} label={t('sections.labelOverride')} defaultValue={d?.label} required={false} maxLength={120} />
                  </div>
                </details>
              </div>
            );
          })}
          <SubmitButton>{t('common.save')}</SubmitButton>
        </ActionForm>
      </Card>

      {section.status === 'ACTIVE' ? (
        <Card>
          <ActionForm action={sectionStatusAction} confirmMessage={t('common.confirm')} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={section.id} />
            <input type="hidden" name="status" value="ARCHIVED" />
            <div className="min-w-64 flex-1">
              <Field label={t('common.reason')} name="reason" required={false} />
            </div>
            <SubmitButton tone="danger">{t('common.archive')}</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}
    </div>
  );
}

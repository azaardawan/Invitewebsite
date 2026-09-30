import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { listSections } from '@/server/catalog/sections';
import { localized } from '@/server/catalog/common';
import { publicMediaUrl } from '@/server/storage';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import { I18nInputs } from '@/components/admin/I18nInputs';
import { Badge, Card, MoveButtons } from '@/components/admin/bits';
import { createSectionAction, moveSectionAction, sectionStatusAction } from '@/app/admin/_actions/catalog';

export default async function SectionsPage() {
  await requireAdmin({ permission: 'sections.manage' });
  const t = await getTranslations('admin.catalog');
  const locale = await getLocale();
  const rows = await listSections(db(), { includeArchived: true });
  const active = rows.filter((r) => r.section.status === 'ACTIVE');
  const archived = rows.filter((r) => r.section.status === 'ARCHIVED');

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t('sections.heading')}</h1>
        <p className="mt-1 text-muted">{t('sections.intro')}</p>
      </header>

      <ul className="space-y-3">
        {active.map(({ section, themeCount, imageKey }) => (
          <li key={section.id}>
            <Card className="flex items-center gap-4">
              {imageKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={publicMediaUrl(imageKey)} alt="" className="size-14 rounded-md object-cover" />
              ) : (
                <div className="size-14 rounded-md bg-canvas" />
              )}
              <div className="min-w-0 flex-1">
                <Link href={`/admin/sections/${section.id}`} className="font-medium underline-offset-4 hover:underline">
                  {localized(section.name, locale)}
                </Link>
                <p className="text-sm text-muted">
                  <span dir="ltr">{section.key}</span> · {t('sections.themesCount', { count: themeCount })}
                </p>
              </div>
              <MoveButtons action={moveSectionAction} id={section.id} labels={{ up: t('common.moveUp'), down: t('common.moveDown') }} />
            </Card>
          </li>
        ))}
      </ul>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t('sections.create')}</h2>
        <ActionForm action={createSectionAction} className="max-w-md space-y-4">
          <Field label={t('sections.key')} name="key" dir="ltr" autoComplete="off" />
          <p className="-mt-3 text-xs text-muted">{t('sections.keyHint')}</p>
          <I18nInputs name="name" label={t('sections.name')} maxLength={60} />
          <SubmitButton>{t('common.create')}</SubmitButton>
        </ActionForm>
      </Card>

      {archived.length ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">{t('sections.archivedList')}</h2>
          <ul className="space-y-2">
            {archived.map(({ section }) => (
              <li key={section.id}>
                <Card className="flex items-center justify-between gap-3">
                  <span>
                    {localized(section.name, locale)} <Badge status="ARCHIVED">{t('common.archived')}</Badge>
                  </span>
                  <ActionForm action={sectionStatusAction}>
                    <input type="hidden" name="id" value={section.id} />
                    <input type="hidden" name="status" value="ACTIVE" />
                    <SubmitButton tone="secondary">{t('common.restore')}</SubmitButton>
                  </ActionForm>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

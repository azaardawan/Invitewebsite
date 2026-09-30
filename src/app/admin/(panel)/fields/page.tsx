import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { listFields } from '@/server/catalog/fields';
import { localized } from '@/server/catalog/common';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import { I18nInputs } from '@/components/admin/I18nInputs';
import { Card } from '@/components/admin/bits';
import { updateFieldAction } from '../../_actions/catalog';

export default async function FieldsPage() {
  await requireAdmin({ permission: 'sections.manage' });
  const t = await getTranslations('admin.catalog');
  const locale = await getLocale();
  const fields = await listFields(db());

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t('fields.heading')}</h1>
        <p className="mt-1 text-muted">{t('fields.intro')}</p>
      </header>
      {fields.map((f) => (
        <Card key={f.key}>
          <details>
            <summary className="cursor-pointer">
              <span className="font-medium">{localized(f.label, locale)}</span>{' '}
              <span className="font-mono text-xs text-muted" dir="ltr">
                {f.key}
              </span>{' '}
              <span className="text-xs text-muted">· {t(`fieldTypes.${f.type}` as never)}</span>
            </summary>
            <ActionForm action={updateFieldAction} className="mt-4 space-y-4">
              <input type="hidden" name="key" value={f.key} />
              <I18nInputs name="label" label={t('fields.label')} defaultValue={f.label} maxLength={120} />
              {f.type === 'text' || f.type === 'longtext' ? (
                <div className="w-40">
                  <Field label={t('fields.maxLength')} name="maxLength" type="number" defaultValue={String(f.maxLength ?? '')} />
                </div>
              ) : null}
              <SubmitButton>{t('common.save')}</SubmitButton>
            </ActionForm>
          </details>
        </Card>
      ))}
    </div>
  );
}

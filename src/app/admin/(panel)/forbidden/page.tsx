import { getTranslations } from 'next-intl/server';

export default async function ForbiddenPage() {
  const t = await getTranslations('admin.forbidden');
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold">{t('heading')}</h1>
      <p className="mt-2 text-muted">{t('body')}</p>
    </div>
  );
}

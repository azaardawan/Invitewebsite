import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { can } from '@/server/rbac/authz';
import { listThemes } from '@/server/catalog/themes';
import { listSections } from '@/server/catalog/sections';
import { localized } from '@/server/catalog/common';
import { publicMediaUrl } from '@/server/storage';
import { ActionForm, SubmitButton } from '@/components/admin/forms';
import { Badge, Card, MoveButtons, formatIqd } from '@/components/admin/bits';
import { moveThemeAction, syncThemesAction } from '@/app/admin/_actions/catalog';
import { themeNumber } from '@/theme-registry';
import { ThemeNumber } from '@/components/admin/ThemeNumber';

const STATUSES = ['DEVELOPMENT', 'READY_FOR_REVIEW', 'ACTIVE', 'ARCHIVED'] as const;

export default async function ThemesPage({ searchParams }: PageProps<'/admin/themes'>) {
  const { authz } = await requireAdmin({ permission: 'themes.view' });
  const t = await getTranslations('admin.catalog');
  const locale = await getLocale();
  const params = await searchParams;
  const search = typeof params.q === 'string' ? params.q.slice(0, 80) : '';
  const sectionId = z.uuid().safeParse(params.section).data;
  const status = z.enum(STATUSES).safeParse(params.status).data;
  const [rows, sections] = await Promise.all([
    listThemes(db(), { search: search || undefined, sectionId, status }),
    listSections(db(), { includeArchived: true }),
  ]);
  const canManage = can(authz, 'themes.manage');

  return (
    <div className="max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('themes.heading')}</h1>
          <p className="mt-1 text-muted">{t('themes.intro')}</p>
        </div>
        {canManage ? (
          <ActionForm action={syncThemesAction}>
            <SubmitButton tone="secondary">{t('themes.sync')}</SubmitButton>
          </ActionForm>
        ) : null}
      </header>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-sm">{t('themes.search')}</span>
          <input name="q" defaultValue={search} placeholder={t('themes.searchHint')} className="rounded-md border border-line bg-surface px-3 py-2" />
        </label>
        <select name="section" defaultValue={sectionId ?? ''} aria-label={t('themes.section')} className="rounded-md border border-line bg-surface px-3 py-2">
          <option value="">{t('themes.allSections')}</option>
          {sections.map(({ section }) => (
            <option key={section.id} value={section.id}>
              {localized(section.name, locale)}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ''} aria-label={t('themes.lifecycle')} className="rounded-md border border-line bg-surface px-3 py-2">
          <option value="">{t('themes.allStatuses')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`themes.status.${s}`)}
            </option>
          ))}
        </select>
        <button className="rounded-md border border-line bg-surface px-4 py-2 text-sm">{t('themes.filter')}</button>
      </form>

      {rows.length === 0 ? <p className="text-muted">{t('themes.empty')}</p> : null}
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.theme.id}>
            <Card className="flex flex-wrap items-center gap-4">
              {r.coverKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={publicMediaUrl(r.coverKey)} alt="" className="h-20 w-14 rounded-md object-cover" />
              ) : (
                <div className="flex h-20 w-14 items-center justify-center rounded-md bg-canvas text-center text-[10px] text-muted">
                  {t('themes.noCover')}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="flex flex-wrap items-center gap-2">
                  <ThemeNumber n={themeNumber(r.theme.key)} label={t('themes.number')} />
                  <Link href={`/admin/themes/${r.theme.id}`} className="font-medium underline-offset-4 hover:underline">
                    {localized(r.theme.name, locale)}
                  </Link>
                  <Badge status={r.theme.status}>{t(`themes.status.${r.theme.status}`)}</Badge>
                </p>
                <p className="text-sm text-muted">
                  {r.sectionName ? localized(r.sectionName, locale) : t('themes.noSection')} ·{' '}
                  <span dir="ltr" className="font-mono text-xs">
                    {r.versionRef ?? '—'}
                  </span>
                </p>
                <p className="text-sm text-muted">
                  {t('themes.packagesCount')}: {r.activePackages}
                  {r.minPrice ? ` · ${t('themes.fromPrice')} ${formatIqd(Number(r.minPrice), locale)}` : ''} ·{' '}
                  {r.musicTitle ?? t('themes.noMusic')}
                </p>
              </div>
              {canManage && r.theme.status !== 'ARCHIVED' ? (
                <MoveButtons action={moveThemeAction} id={r.theme.id} labels={{ up: t('common.moveUp'), down: t('common.moveDown') }} />
              ) : null}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

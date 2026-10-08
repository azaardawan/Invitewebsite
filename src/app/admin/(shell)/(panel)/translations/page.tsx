import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { listTranslations, TRANSLATION_GROUPS } from '@/server/i18n/translations';
import { Badge, Card } from '@/components/admin/bits';
import { ActionForm, SubmitButton } from '@/components/admin/forms';
import { localeMeta, locales } from '@/i18n/config';
import { saveTranslationAction } from '../../../_actions/translations';

const PER_PAGE = 25;

export default async function TranslationsPage({ searchParams }: PageProps<'/admin/translations'>) {
  const { authz } = await requireAdmin({ permission: 'translations.manage' });
  const t = await getTranslations('admin.translations');
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : '';
  const filter = z.enum(['missing', 'edited']).safeParse(sp.filter).data;
  const group = z.enum(TRANSLATION_GROUPS as [string, ...string[]]).safeParse(sp.group).data;
  const rows = await listTranslations(db(), { q: q || undefined, filter, group });
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const shown = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const ownsKurdish = authz.roleKeys.includes('OWNER');
  const link = (p: number) => `/admin/translations?${new URLSearchParams({ ...(q ? { q } : {}), ...(filter ? { filter } : {}), ...(group ? { group } : {}), page: String(p) })}`;

  return (
    <div className="max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t('heading')}</h1>
        <p className="text-muted">{t('intro')}</p>
        <p className="text-sm text-muted">{t('placeholderHelp')}</p>
        {!ownsKurdish ? <p className="text-sm text-muted">{t('kurdishOwnerOnly')}</p> : null}
      </header>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <input name="q" defaultValue={q} aria-label={t('search')} placeholder={t('search')} className="w-64 rounded-md border border-line bg-surface px-3 py-2" />
        <select name="group" defaultValue={group ?? ''} aria-label={t('allGroups')} className="rounded-md border border-line bg-surface px-3 py-2">
          <option value="">{t('allGroups')}</option>
          {TRANSLATION_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select name="filter" defaultValue={filter ?? ''} aria-label={t('filter')} className="rounded-md border border-line bg-surface px-3 py-2">
          <option value="">{t('filterAll')}</option>
          <option value="missing">{t('filterMissing')}</option>
          <option value="edited">{t('filterEdited')}</option>
        </select>
        <button className="rounded-md border border-line bg-surface px-4 py-2 text-sm">{t('filter')}</button>
        <span className="text-sm text-muted">{t('count', { count: rows.length })}</span>
      </form>

      {shown.length === 0 ? <p className="text-muted">{t('empty')}</p> : null}
      <ul className="space-y-3">
        {shown.map((r) => (
          <li key={r.key}>
            <Card>
              <ActionForm action={saveTranslationAction} className="space-y-3">
                <input type="hidden" name="key" value={r.key} />
                <div className="flex flex-wrap items-center gap-2">
                  <code dir="ltr" className="text-xs text-muted">
                    {r.key}
                  </code>
                  {Object.keys(r.edited).length ? <Badge status="ACTIVE">{t('edited')}</Badge> : null}
                  {r.missingKurdish ? <Badge status="READY_FOR_REVIEW">{t('missing')}</Badge> : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {locales.map((l) => {
                    const kurdish = l === 'ckb' || l === 'bdn';
                    const value = r.edited[l] ?? r.shipped[l] ?? '';
                    return (
                      <label key={l} className="block">
                        <span className="mb-1 flex items-center gap-2 text-sm font-medium">
                          {localeMeta[l].autonym}
                          {r.edited[l] !== undefined ? <span className="text-xs text-accent">● {t('edited')}</span> : null}
                        </span>
                        <textarea
                          name={kurdish && !ownsKurdish ? undefined : l}
                          defaultValue={value}
                          disabled={kurdish && !ownsKurdish}
                          placeholder={kurdish && !value ? r.edited.ar ?? r.shipped.ar : undefined}
                          dir={localeMeta[l].dir}
                          lang={localeMeta[l].htmlLang}
                          rows={Math.min(6, Math.max(2, Math.ceil((r.shipped.ar?.length ?? 0) / 60)))}
                          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm disabled:opacity-60"
                        />
                        {kurdish && !value ? <span className="text-xs text-muted">{t('fallsBack')}</span> : null}
                      </label>
                    );
                  })}
                </div>
                <SubmitButton>{t('save')}</SubmitButton>
              </ActionForm>
            </Card>
          </li>
        ))}
      </ul>

      {pages > 1 ? (
        <nav className="flex items-center gap-4 text-sm">
          {page > 1 ? (
            <Link href={link(page - 1)} className="text-accent underline">
              {t('prev')}
            </Link>
          ) : null}
          <span className="text-muted">{t('page', { page, pages })}</span>
          {page < pages ? (
            <Link href={link(page + 1)} className="text-accent underline">
              {t('next')}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

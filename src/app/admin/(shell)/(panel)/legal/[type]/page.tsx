import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { POLICY_SLUGS, policyAdminView, policyTypeFromSlug } from '@/server/legal/policies';
import { Card } from '@/components/admin/bits';
import { ActionForm, SubmitButton } from '@/components/admin/forms';
import { PolicyText } from '@/components/legal/PolicyText';
import { discardLegalDraftAction, publishLegalAction, saveLegalDraftAction } from '@/app/admin/_actions/legal';

const LANGS = [
  { code: 'ar', dir: 'rtl' },
  { code: 'en', dir: 'ltr' },
  { code: 'ckb', dir: 'rtl' },
  { code: 'bdn', dir: 'rtl' },
] as const;

export default async function LegalEditPage({ params }: PageProps<'/admin/legal/[type]'>) {
  await requireAdmin({ permission: 'legal.manage' });
  const type = policyTypeFromSlug((await params).type);
  if (!type) notFound();
  const t = await getTranslations('admin.legal');
  const locale = await getLocale();
  const intl = locale === 'ar' ? 'ar-IQ' : 'en-GB';
  const { draft, published } = await policyAdminView(db(), type);
  const live = published[0] ?? null;
  const base = draft?.content ?? live?.content ?? null;

  return (
    <div className="max-w-4xl space-y-6">
      <header className="space-y-2">
        <Link href="/admin/legal" className="text-sm text-accent underline">
          {t('heading')}
        </Link>
        <h1 className="text-2xl font-semibold">{t(`types.${type}`)}</h1>
        <p className="text-sm text-muted">
          {live?.publishedAt
            ? t('liveVersion', { version: live.version, date: new Intl.DateTimeFormat(intl, { dateStyle: 'medium' }).format(live.publishedAt) })
            : t('notPublished')}{' '}
          <a href={`/${locale === 'ar' ? '' : 'en/'}legal/${POLICY_SLUGS[type]}`} target="_blank" rel="noopener" className="text-accent underline">
            {t('viewOnSite')}
          </a>
        </p>
      </header>

      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold">{draft ? t('draftTitle', { version: draft.version }) : t('newDraftTitle')}</h2>
          <p className="text-sm text-muted">{t('markupHelp')}</p>
          <p className="text-sm text-muted">{t('kurdishHelp')}</p>
        </div>
        <ActionForm action={saveLegalDraftAction} className="space-y-4">
          <input type="hidden" name="type" value={type} />
          {LANGS.map(({ code, dir }) => (
            <label key={code} className="block">
              <span className="mb-1 block text-sm font-medium">{t(`lang.${code}`)}</span>
              <textarea
                name={code}
                dir={dir}
                rows={code === 'ar' || code === 'en' ? 16 : 6}
                required={code === 'ar' || code === 'en'}
                maxLength={30000}
                defaultValue={(base as Record<string, string | null | undefined> | null)?.[code] ?? ''}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm leading-relaxed"
              />
            </label>
          ))}
          <SubmitButton>{t('saveDraft')}</SubmitButton>
        </ActionForm>
        {draft ? (
          <div className="flex flex-wrap gap-3 border-t border-line pt-4">
            <ActionForm action={publishLegalAction} confirmMessage={t('publishConfirm')}>
              <input type="hidden" name="type" value={type} />
              <SubmitButton>{t('publish')}</SubmitButton>
            </ActionForm>
            <ActionForm action={discardLegalDraftAction} confirmMessage={t('discardConfirm')}>
              <input type="hidden" name="type" value={type} />
              <SubmitButton tone="secondary">{t('discard')}</SubmitButton>
            </ActionForm>
          </div>
        ) : null}
      </Card>

      {draft ? (
        <Card className="space-y-3">
          <h2 className="font-semibold">{t('previewTitle')}</h2>
          <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <PolicyText source={locale === 'ar' ? draft.content.ar : draft.content.en} />
          </div>
        </Card>
      ) : null}

      {published.length ? (
        <Card className="space-y-2">
          <h2 className="font-semibold">{t('historyTitle')}</h2>
          <ul className="space-y-1 text-sm">
            {published.map((p) => (
              <li key={p.id}>
                {t('historyRow', { version: p.version, date: p.publishedAt ? new Intl.DateTimeFormat(intl, { dateStyle: 'medium', timeStyle: 'short' }).format(p.publishedAt) : '—' })}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">{t('historyNote')}</p>
        </Card>
      ) : null}
    </div>
  );
}

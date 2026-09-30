import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { can } from '@/server/rbac/authz';
import { THEME_TRANSITIONS, getThemeDetail, type ThemeStatus } from '@/server/catalog/themes';
import { listSections } from '@/server/catalog/sections';
import { listMusic } from '@/server/catalog/music';
import { CatalogError, localized } from '@/server/catalog/common';
import { MAX_ACTIVE_PACKAGES } from '@/server/catalog/packages';
import { publicMediaUrl } from '@/server/storage';
import type { I18nContent } from '@/server/db/schema';
import type { ThemeManifest } from '@/theme-sdk/manifest';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import { I18nInputs } from '@/components/admin/I18nInputs';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Badge, Card, MoveButtons, formatIqd } from '@/components/admin/bits';
import { ThemePreviewPanel } from '@/components/admin/ThemePreviewPanel';
import { formatUsd } from '@/lib/currency';
import { getSettings } from '@/server/settings/service';
import {
  createPackageAction,
  currentVersionAction,
  movePackageAction,
  packageStatusAction,
  themeFieldsAction,
  themeSettingsAction,
  themeTransitionAction,
  updatePackageAction,
} from '@/app/admin/_actions/catalog';

type Translate = Awaited<ReturnType<typeof getTranslations<'admin.catalog'>>>;

/** Radio choices = the theme's designed states. States lacking the section's required features are disabled. */
function StateChoices({
  manifest,
  required,
  selected,
  fieldLabel,
  t,
}: {
  manifest: ThemeManifest;
  required: string[];
  selected: number;
  fieldLabel: (key: string) => string;
  t: Translate;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{t('themes.state')}</legend>
      <p className="text-xs text-muted">{t('themes.stateHint')}</p>
      {manifest.validStates.map((s, i) => {
        const missing = required.filter((r) => !(s.features as string[]).includes(r));
        return (
          <label key={i} className={`flex gap-2 rounded-md border border-line p-2 text-sm ${missing.length ? 'opacity-60' : ''}`}>
            <input type="radio" name="state" value={i} required defaultChecked={i === selected} disabled={missing.length > 0} />
            <span>
              <span className="block font-medium">{s.features.map((f) => t(`features.${f}`)).join('، ') || '—'}</span>
              <span className="block text-xs text-muted">{t('themes.stateFields', { fields: s.fields.map(fieldLabel).join('، ') })}</span>
              {missing.length ? (
                <span className="block text-xs text-danger">
                  {t('themes.stateMissing', { features: missing.map((f) => t(`features.${f}` as never)).join('، ') })}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function stateIndex(manifest: ThemeManifest, features: string[], fields: string[]) {
  const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));
  return manifest.validStates.findIndex((s) => same(s.features, features) && same(s.fields, fields));
}

export default async function ThemeDetailPage({ params }: PageProps<'/admin/themes/[id]'>) {
  const { authz } = await requireAdmin({ permission: 'themes.view' });
  const { id } = await params;
  const d = await getThemeDetail(db(), id).catch((e) => (e instanceof CatalogError ? null : Promise.reject(e)));
  if (!d) notFound();
  const t = await getTranslations('admin.catalog');
  const locale = await getLocale();
  const [sections, music, settings] = await Promise.all([
    listSections(db(), { includeArchived: true }),
    listMusic(db()),
    getSettings(db()),
  ]);
  const rate = settings.currency.usdRateIqd;
  const price = (iqd: number) =>
    rate ? `${formatIqd(iqd, locale)} (≈ ${formatUsd(iqd / rate, locale === 'ar' ? 'ar-IQ' : 'en-US')})` : formatIqd(iqd, locale);
  const canManage = can(authz, 'themes.manage');
  const manifest = d.currentManifest;
  const required = d.section?.requiredFeatures ?? [];
  const labels = new Map(d.fields.map((f) => [f.fieldKey, localized(f.effectiveLabel as I18nContent, locale)]));
  const fieldLabel = (k: string) => labels.get(k) ?? k;
  const active = d.packages.filter((p) => p.status === 'ACTIVE');
  const archived = d.packages.filter((p) => p.status === 'ARCHIVED');
  const transitions = Object.entries(THEME_TRANSITIONS[d.theme.status]).filter(([, perm]) => can(authz, perm!)) as [ThemeStatus, string][];

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/themes" className="text-sm text-muted underline">
        {t('common.back')}
      </Link>
      <header className="space-y-1">
        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold">
          {localized(d.theme.name, locale)} <Badge status={d.theme.status}>{t(`themes.status.${d.theme.status}`)}</Badge>
        </h1>
        <p className="font-mono text-sm text-muted" dir="ltr">
          {d.theme.key}
        </p>
        {manifest?.internal ? <p className="text-sm text-danger">{t('themes.internal')}</p> : null}
      </header>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">{t('themes.readiness')}</h2>
        {d.readiness.length ? (
          <ul className="list-disc space-y-1 ps-5 text-sm text-danger">
            {d.readiness.map((p, i) => (
              <li key={i}>
                {t(`themes.problems.${p.code}` as never)}
                {p.subject ? `: ${p.subject}` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-success">{t('themes.readyOk')}</p>
        )}
        {transitions.length ? (
          <div className="flex flex-wrap gap-4 border-t border-line pt-4">
            {transitions.map(([to]) => (
              <ActionForm
                key={to}
                action={themeTransitionAction}
                confirmMessage={
                  to === 'ACTIVE'
                    ? t('themes.confirmActivate')
                    : to === 'ARCHIVED' && d.theme.status === 'ACTIVE'
                      ? t('themes.confirmArchiveActive')
                      : t('common.confirm')
                }
                className="flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="id" value={d.theme.id} />
                <input type="hidden" name="to" value={to} />
                <input
                  name="reason"
                  placeholder={t('common.reason')}
                  aria-label={t('common.reason')}
                  className="rounded-md border border-line bg-surface px-3 py-2 text-sm"
                />
                <SubmitButton tone={to === 'ARCHIVED' ? 'danger' : to === 'ACTIVE' ? 'primary' : 'secondary'}>
                  {d.theme.status === 'ARCHIVED' && to === 'ACTIVE' ? t('common.restore') : t(`themes.transition.${to}`)}
                </SubmitButton>
              </ActionForm>
            ))}
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t('themes.preview')}</h2>
        {manifest ? (
          <ThemePreviewPanel
            themeKey={d.theme.key}
            packages={active.map((p) => ({ value: p.id, label: `${localized(p.name, locale)} · ${price(p.priceIqd)}` }))}
            states={manifest.validStates.map((s, i) => ({
              value: String(i),
              label: `${t('preview.state', { n: i + 1 })}: ${s.features.map((f) => t(`features.${f}` as never)).join('، ') || '—'}`,
            }))}
            versions={d.versions.filter((v) => v.inBuild).map((v) => ({ value: String(v.version), label: v.codeRef }))}
            defaultVersion={String(d.versions.find((v) => v.id === d.theme.currentVersionId)?.version ?? 1)}
          />
        ) : (
          <p className="text-sm text-muted">{t('themes.problems.noVersion')}</p>
        )}
      </Card>

      {canManage ? (
        <Card>
          <h2 className="mb-4 text-lg font-semibold">{t('themes.settings')}</h2>
          <ActionForm action={themeSettingsAction} className="space-y-5">
            <input type="hidden" name="id" value={d.theme.id} />
            <I18nInputs name="name" label={t('themes.name')} defaultValue={d.theme.name} maxLength={60} />
            <I18nInputs name="description" label={t('themes.description')} defaultValue={d.theme.description} required={false} multiline maxLength={500} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('themes.section')}</span>
              <select name="sectionId" defaultValue={d.theme.sectionId ?? ''} className="w-full rounded-md border border-line bg-surface px-3 py-2">
                <option value="">{t('themes.noSection')}</option>
                {sections.map(({ section }) => (
                  <option key={section.id} value={section.id}>
                    {localized(section.name, locale)}
                    {section.status === 'ARCHIVED' ? ` (${t('common.archived')})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <ImageUpload name="coverAssetId" label={t('themes.cover')} initial={d.cover ? { id: d.cover.id, url: publicMediaUrl(d.cover.storageKey) } : null} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('themes.musicSelect')}</span>
              <select name="musicTrackId" defaultValue={d.theme.musicTrackId ?? ''} className="w-full rounded-md border border-line bg-surface px-3 py-2">
                <option value="">{t('themes.noMusic')}</option>
                {music
                  .filter((m) => m.track.status === 'ACTIVE' || m.track.id === d.theme.musicTrackId)
                  .map((m) => (
                    <option key={m.track.id} value={m.track.id}>
                      {m.track.title}
                    </option>
                  ))}
              </select>
            </label>
            {d.music ? <audio controls preload="none" src={publicMediaUrl(music.find((m) => m.track.id === d.music!.id)!.asset.storageKey)} className="w-full" /> : null}
            <SubmitButton>{t('common.save')}</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t('themes.packages')}</h2>
          <p className="text-sm text-muted">{t('themes.packagesHint')}</p>
        </div>
        {active.map((p) => (
          <div key={p.id} className="rounded-md border border-line p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {localized(p.name, locale)} · {price(p.priceIqd)}
              </p>
              {canManage ? (
                <MoveButtons
                  action={movePackageAction}
                  id={p.id}
                  extra={{ themeId: d.theme.id }}
                  labels={{ up: t('common.moveUp'), down: t('common.moveDown') }}
                />
              ) : null}
            </div>
            <p className="text-sm text-muted">{p.featureKeys.map((f) => t(`features.${f}` as never)).join('، ')}</p>
            {canManage && manifest ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-accent">{t('common.edit')}</summary>
                <ActionForm action={updatePackageAction} className="mt-3 space-y-4">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="themeId" value={d.theme.id} />
                  <I18nInputs name="name" label={t('themes.packageName')} defaultValue={p.name} maxLength={40} />
                  <I18nInputs name="description" label={t('themes.description')} defaultValue={p.description} required={false} multiline maxLength={300} />
                  <div className="w-48">
                    <Field label={t('themes.price')} name="priceIqd" inputMode="numeric" dir="ltr" defaultValue={String(p.priceIqd)} />
                  </div>
                  <StateChoices manifest={manifest} required={required} selected={stateIndex(manifest, p.featureKeys, p.fieldKeys)} fieldLabel={fieldLabel} t={t} />
                  <SubmitButton>{t('common.save')}</SubmitButton>
                </ActionForm>
                <ActionForm action={packageStatusAction} confirmMessage={t('common.confirm')} className="mt-3">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="themeId" value={d.theme.id} />
                  <input type="hidden" name="status" value="ARCHIVED" />
                  <SubmitButton tone="danger">{t('common.archive')}</SubmitButton>
                </ActionForm>
              </details>
            ) : null}
          </div>
        ))}

        {canManage && manifest ? (
          active.length < MAX_ACTIVE_PACKAGES ? (
            <details className="rounded-md border border-dashed border-line p-3" open={active.length === 0}>
              <summary className="cursor-pointer font-medium text-accent">{t('themes.addPackage')}</summary>
              <ActionForm action={createPackageAction} className="mt-3 space-y-4">
                <input type="hidden" name="themeId" value={d.theme.id} />
                <I18nInputs name="name" label={t('themes.packageName')} maxLength={40} />
                <I18nInputs name="description" label={t('themes.description')} required={false} multiline maxLength={300} />
                <div className="w-48">
                  <Field label={t('themes.price')} name="priceIqd" inputMode="numeric" dir="ltr" />
                </div>
                <StateChoices manifest={manifest} required={required} selected={-1} fieldLabel={fieldLabel} t={t} />
                <SubmitButton>{t('common.create')}</SubmitButton>
              </ActionForm>
            </details>
          ) : (
            <p className="text-sm text-muted">{t('themes.maxPackages')}</p>
          )
        ) : null}

        {archived.length ? (
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted">{t('themes.archivedPackages')}</h3>
            <ul className="space-y-2">
              {archived.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    {localized(p.name, locale)} · {price(p.priceIqd)}
                  </span>
                  {canManage ? (
                    <ActionForm action={packageStatusAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="themeId" value={d.theme.id} />
                      <input type="hidden" name="status" value="ACTIVE" />
                      <SubmitButton tone="secondary">{t('common.restore')}</SubmitButton>
                    </ActionForm>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">{t('themes.fields')}</h2>
        <p className="mb-4 text-sm text-muted">{t('themes.fieldsHint')}</p>
        <ActionForm action={themeFieldsAction} className="space-y-3">
          <input type="hidden" name="id" value={d.theme.id} />
          {d.fields.map((f, i) => (
            <div key={f.fieldKey} className="rounded-md border border-line p-3">
              <input type="hidden" name="fieldKey" value={f.fieldKey} />
              <div className="flex flex-wrap items-center gap-4">
                <p className="flex-1 text-sm">
                  <span className="font-medium">{localized(f.effectiveLabel as I18nContent, locale)}</span>{' '}
                  <span className="font-mono text-xs text-muted" dir="ltr">
                    {f.fieldKey}
                  </span>
                </p>
                <div className="w-24">
                  <Field label={t('common.order')} name={`tf.${f.fieldKey}.order`} type="number" defaultValue={String(i)} required={false} />
                </div>
              </div>
              {canManage ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-accent">{t('sections.labelOverride')}</summary>
                  <div className="mt-2">
                    <I18nInputs name={`tf.${f.fieldKey}.label`} label={t('sections.labelOverride')} defaultValue={f.themeLabel} required={false} maxLength={120} />
                  </div>
                </details>
              ) : null}
            </div>
          ))}
          {canManage ? <SubmitButton>{t('common.save')}</SubmitButton> : null}
        </ActionForm>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">{t('themes.versions')}</h2>
        <p className="mb-4 text-sm text-muted">{t('themes.versionsHint')}</p>
        <ul className="space-y-2">
          {d.versions.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line p-2 text-sm">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-mono" dir="ltr">
                  {v.codeRef}
                </span>
                {v.id === d.theme.currentVersionId ? <Badge status="ACTIVE">{t('themes.current')}</Badge> : null}
                <span className={v.inBuild ? 'text-muted' : 'text-danger'}>{v.inBuild ? t('themes.inBuild') : t('themes.notInBuild')}</span>
                {v.frozenAt ? <span className="text-muted">· {t('themes.frozen')}</span> : null}
              </span>
              {canManage && v.id !== d.theme.currentVersionId && v.inBuild ? (
                <ActionForm action={currentVersionAction} confirmMessage={t('common.confirm')}>
                  <input type="hidden" name="id" value={d.theme.id} />
                  <input type="hidden" name="versionId" value={v.id} />
                  <SubmitButton tone="secondary">{t('themes.makeCurrent')}</SubmitButton>
                </ActionForm>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

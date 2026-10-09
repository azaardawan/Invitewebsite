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
import { themeBorder } from '@/server/catalog/border';
import { listPalettes } from '@/server/catalog/palettes';
import { listSubsections } from '@/server/catalog/subsections';
import { themeNumber } from '@/theme-registry';
import { ThemeNumber } from '@/components/admin/ThemeNumber';
import { CardDesignSection } from './CardDesignSection';
import { publicMediaUrl } from '@/server/storage';
import type { I18nContent } from '@/server/db/schema';
import type { ThemeManifest } from '@/theme-sdk/manifest';
import { PLATFORM_FEATURES } from '@/catalog/features';
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
  themeBorderAction,
  savePaletteAction,
  paletteStatusAction,
  themeTransitionAction,
  updatePackageAction,
} from '@/app/admin/_actions/catalog';

type Translate = Awaited<ReturnType<typeof getTranslations<'admin.catalog'>>>;

/** What a package includes: each feature and field the theme supports, ticked one by one; nothing is locked on. */
function PackageContents({
  manifest,
  features,
  fields,
  fieldLabel,
  t,
}: {
  manifest: ThemeManifest;
  features: readonly string[];
  fields: readonly string[];
  fieldLabel: (key: string) => string;
  t: Translate;
}) {
  return (
    <div className="space-y-3">
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">{t('themes.packageFeatures')}</legend>
        <p className="text-xs text-muted">{t('themes.packageFeaturesHint')}</p>
        {[...manifest.features, ...PLATFORM_FEATURES].map((f) => (
          <label key={f} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="features" value={f} defaultChecked={features.includes(f)} />
            <span>{t(`features.${f}` as never)}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">{t('themes.packageFields')}</legend>
        <p className="text-xs text-muted">{t('themes.packageFieldsHint')}</p>
        {manifest.fields.map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="fields" value={k} defaultChecked={fields.includes(k)} />
            <span>{fieldLabel(k)}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
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
  const border = await themeBorder(db(), d.theme.id);
  const colorSlots = manifest?.colors?.slots ?? [];
  const themeSubs = d.theme.sectionId ? await listSubsections(db(), d.theme.sectionId) : [];
  const palettes = colorSlots.length ? await listPalettes(db(), d.theme.id) : [];
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
          <ThemeNumber n={themeNumber(d.theme.key)} label={t('themes.number')} />
          {localized(d.theme.name, locale)} <Badge status={d.theme.status}>{t(`themes.status.${d.theme.status}`)}</Badge>
        </h1>
        <p className="font-mono text-sm text-muted" dir="ltr">
          {d.theme.key} · themes/{d.theme.key}/
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
            {themeSubs.length ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium">{t('subsections.themeSubsection')}</span>
                <select name="subsectionId" defaultValue={d.theme.subsectionId ?? ''} className="w-full rounded-md border border-line bg-surface px-3 py-2">
                  <option value="">{t('subsections.none')}</option>
                  {themeSubs.map(({ subsection: sub }) => (
                    <option key={sub.id} value={sub.id}>
                      {localized(sub.name, locale)}
                      {sub.status === 'ARCHIVED' ? ` (${t('subsections.hidden')})` : ''}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-muted">{t('subsections.themeHint')}</span>
              </label>
            ) : null}
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

      {canManage ? (
        <Card>
          <h2 className="mb-1 text-lg font-semibold">{t('themes.border')}</h2>
          <p className="mb-4 text-sm text-muted">{t('themes.borderHint')}</p>
          <p className="mb-3 text-sm">{border ? t('themes.borderCustom') : t('themes.borderOwn')}</p>
          <ActionForm action={themeBorderAction} className="space-y-4">
            <input type="hidden" name="id" value={d.theme.id} />
            <ImageUpload name="borderAssetId" label={t('themes.borderImage')} initial={border && d.theme.borderAssetId ? { id: d.theme.borderAssetId, url: border.src } : null} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('themes.borderKind')}</span>
              <select name="kind" defaultValue={border?.kind ?? 'strips'} className="w-full rounded-md border border-line bg-surface px-3 py-2">
                <option value="strips">{t('themes.borderStrips')}</option>
                <option value="corners">{t('themes.borderCorners')}</option>
              </select>
            </label>
            <div className="w-48">
              <Field label={t('themes.borderSize')} name="size" inputMode="numeric" dir="ltr" defaultValue={String(border?.size ?? 24)} />
            </div>
            <SubmitButton>{t('common.save')}</SubmitButton>
          </ActionForm>
          {border ? (
            <ActionForm action={themeBorderAction} className="mt-3">
              <input type="hidden" name="id" value={d.theme.id} />
              <input type="hidden" name="restore" value="1" />
              <SubmitButton tone="danger">{t('themes.borderRestore')}</SubmitButton>
            </ActionForm>
          ) : null}
        </Card>
      ) : null}

      {(() => {
        const current = d.versions.find((v) => v.id === d.theme.currentVersionId);
        return (
          <CardDesignSection
            themeId={d.theme.id}
            themeKey={d.theme.key}
            codeRef={current?.inBuild ? current.codeRef : null}
            version={current?.version ?? null}
            design={d.theme.cardDesign}
            updatedAt={d.theme.updatedAt}
            canManage={canManage}
          />
        );
      })()}

      {canManage && colorSlots.length ? (
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t('themes.palettes')}</h2>
            <p className="text-sm text-muted">{t('themes.palettesHint')}</p>
          </div>
          {[...palettes, null].map((p) => (
            <details key={p?.id ?? 'new'} open={!p && !palettes.length} className="rounded-md border border-line p-3">
              <summary className="flex cursor-pointer flex-wrap items-center gap-3">
                {p ? (
                  <>
                    <span className="flex" aria-hidden>
                      {colorSlots.map((c) => (
                        <span key={c.key} className="-ms-1 size-6 rounded-full border-2 border-surface first:ms-0" style={{ background: p.colors[c.key] ?? c.default }} />
                      ))}
                    </span>
                    <span className="font-medium">{localized(p.name, locale)}</span>
                    {p.status === 'ARCHIVED' ? <Badge status="ARCHIVED">{t('themes.paletteArchived')}</Badge> : null}
                    <a href={`/admin/preview/ar/theme/${d.theme.key}?palette=${p.id}`} target="_blank" className="text-sm text-accent underline">
                      {t('themes.palettePreview')}
                    </a>
                  </>
                ) : (
                  <span className="font-medium text-accent">{t('themes.paletteNew')}</span>
                )}
              </summary>
              <ActionForm action={savePaletteAction} className="mt-3 space-y-4">
                <input type="hidden" name="themeId" value={d.theme.id} />
                {p ? <input type="hidden" name="paletteId" value={p.id} /> : null}
                <I18nInputs name="name" label={t('themes.paletteName')} defaultValue={p?.name} maxLength={40} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {colorSlots.map((c) => (
                    <label key={c.key} className="flex flex-col gap-1 text-sm">
                      <span>{locale === 'ar' ? c.label.ar : c.label.en}</span>
                      <input type="color" name={`color.${c.key}`} defaultValue={p?.colors[c.key] ?? c.default} className="h-10 w-full cursor-pointer rounded-md border border-line bg-surface" />
                    </label>
                  ))}
                </div>
                <SubmitButton>{t('common.save')}</SubmitButton>
              </ActionForm>
              {p ? (
                <ActionForm action={paletteStatusAction} className="mt-3">
                  <input type="hidden" name="themeId" value={d.theme.id} />
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="status" value={p.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'} />
                  <SubmitButton tone={p.status === 'ACTIVE' ? 'danger' : 'secondary'}>{p.status === 'ACTIVE' ? t('themes.paletteArchive') : t('themes.paletteRestore')}</SubmitButton>
                </ActionForm>
              ) : null}
            </details>
          ))}
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
                  <PackageContents manifest={manifest} features={p.featureKeys} fields={p.fieldKeys} fieldLabel={fieldLabel} t={t} />
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
                <PackageContents manifest={manifest} features={[...manifest.features, ...required]} fields={manifest.fields} fieldLabel={fieldLabel} t={t} />
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

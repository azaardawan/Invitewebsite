import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { CARD_FONTS, CARD_SIDE_DEFAULTS, themeArtwork, type ArtworkSlot } from '@/server/catalog/card-design';
import type { CardDesign, CardSideDesign } from '@/server/db/schema';
import { printComponents } from '@/theme-registry/print.generated';
import { ActionForm, SubmitButton } from '@/components/admin/forms';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Card } from '@/components/admin/bits';
import { themeCardSideAction } from '@/app/admin/_actions/catalog';

const input = 'w-full rounded-md border border-line bg-surface px-3 py-2';

/**
 * Admin → Themes → Printable card design: the front (portrait) and back (landscape) of the theme's printable
 * card. Each side is the theme's own design until the owner uploads artwork for it; the platform then writes
 * the invitation's text on that artwork with the colours, fonts and placement chosen here.
 */
export async function CardDesignSection({
  themeId,
  themeKey,
  codeRef,
  version,
  design,
  updatedAt,
  canManage,
}: {
  themeId: string;
  themeKey: string;
  codeRef: string | null;
  version: number | null;
  design: CardDesign | null;
  updatedAt: Date;
  canManage: boolean;
}) {
  const t = await getTranslations('admin.catalog.cardDesign');
  const locale = await getLocale();
  const resolved = await themeArtwork(db(), themeId);
  const loaders = codeRef ? printComponents[codeRef] : undefined;
  const own = { front: !!loaders?.card, back: !!loaders?.cardBack };
  // A design without its own front prints the platform's simple front, so there is always something to show.
  const previewable = true;
  const src = (side: 'front' | 'back') =>
    `/admin/preview/${locale}/card/${themeKey}?side=${side}${version ? `&v=${version}` : ''}&t=${updatedAt.getTime()}`;

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t('heading')}</h2>
        <p className="mt-1 text-sm text-muted">{t('intro')}</p>
      </div>

      {previewable ? (
        <div className="flex flex-wrap items-start gap-4" dir="ltr">
          {/* Front A5 portrait (148 × 210 mm ≈ 559 × 794 px) and back landscape, shown at half size. */}
          <figure className="space-y-1">
            <div className="overflow-hidden rounded-md border border-line bg-white" style={{ width: 280, height: 397 }}>
              <iframe title={t('front')} src={src('front')} style={{ width: 560, height: 794, border: 0, transform: 'scale(0.5)', transformOrigin: '0 0' }} />
            </div>
            <figcaption className="text-center text-xs text-muted">{t('front')}</figcaption>
          </figure>
          <figure className="space-y-1">
            <div className="overflow-hidden rounded-md border border-line bg-white" style={{ width: 397, height: 280 }}>
              <iframe title={t('back')} src={src('back')} style={{ width: 794, height: 560, border: 0, transform: 'scale(0.5)', transformOrigin: '0 0' }} />
            </div>
            <figcaption className="text-center text-xs text-muted">{t('back')}</figcaption>
          </figure>
        </div>
      ) : null}
      {!own.front && !resolved.front ? <p className="text-sm text-muted">{t('noFront')}</p> : null}

      {canManage
        ? (['front', 'back'] as const).map((side) => (
            <SideForm
              key={side}
              side={side}
              themeId={themeId}
              current={design?.[side] ?? null}
              resolvedSrc={resolved[side]?.src ?? null}
              title={t(side === 'front' ? 'editFront' : 'editBack')}
              using={resolved[side] ? t('usingArtwork') : own[side] ? t('usingTheme') : side === 'back' ? t('usingSimpleBack') : t('usingSimpleFront')}
              sizeHint={t(side === 'front' ? 'sizeFront' : 'sizeBack')}
              restoreLabel={t(side === 'back' && !own.back ? 'restoreSimple' : side === 'front' && !own.front ? 'restoreSimpleFront' : 'restore')}
            />
          ))
        : null}
      <p className="text-xs text-muted">{t('perInvitation')}</p>
    </Card>
  );
}

/** Upload and style the owner's artwork for one slot (card side or newborn extra). */
export async function SideForm({
  side,
  themeId,
  current,
  resolvedSrc,
  title,
  using,
  sizeHint,
  restoreLabel,
  extra,
}: {
  /** Newborn extras: their layouts, the details to show, and own colours or the shared look. */
  extra?: { layouts: { value: string; label: string }[]; look: { paper: string; ink: string; accent: string; headingFont: string; bodyFont: string } };
  side: ArtworkSlot;
  themeId: string;
  current: CardSideDesign | null;
  resolvedSrc: string | null;
  title: string;
  using: string;
  sizeHint: string;
  restoreLabel: string;
}) {
  const t = await getTranslations('admin.catalog.cardDesign');
  const values = current ?? { ...CARD_SIDE_DEFAULTS, ...(extra ? { ink: extra.look.ink, accent: extra.look.accent, headingFont: extra.look.headingFont as never, bodyFont: extra.look.bodyFont as never } : {}), assetId: '' };
  const show = { gender: true, date: true, parents: true, quote: true, ...(current?.show ?? {}) };
  const check = (name: string, label: string, on: boolean) => (
    <label key={name} className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={on} />
      {label}
    </label>
  );
  return (
    <details className="rounded-md border border-line p-3" data-card-side={side}>
      <summary className="cursor-pointer font-medium">
        {title} <span className="text-sm font-normal text-muted">· {using}</span>
      </summary>
      <p className="mt-2 text-sm text-muted">{sizeHint}</p>
      <ActionForm action={themeCardSideAction} className="mt-3 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={themeId} />
        <input type="hidden" name="side" value={side} />
        <div className="sm:col-span-2">
          <ImageUpload name="assetId" label={extra ? t('artworkOptional') : t('artwork')} initial={current?.assetId && resolvedSrc ? { id: current.assetId, url: resolvedSrc } : null} />
        </div>
        {extra ? (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('layout')}</span>
              <select name="layout" defaultValue={current?.layout ?? extra.layouts[0]!.value} className={input}>
                {extra.layouts.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="space-y-1">
              <legend className="mb-1 text-sm font-medium">{t('showLegend')}</legend>
              {check('showGender', t('showGender'), show.gender)}
              {check('showDate', t('showDate'), show.date)}
              {check('showParents', t('showParents'), show.parents)}
              {check('showQuote', t('showQuote'), show.quote)}
            </fieldset>
            <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
              <input type="checkbox" name="ownLook" defaultChecked={current?.ownLook ?? false} />
              {t('ownLook')}
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('paper')}</span>
              <input type="color" name="paper" defaultValue={current?.paper ?? extra.look.paper} className="h-10 w-20 rounded-md border border-line" />
            </label>
          </>
        ) : null}
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t('accent')}</span>
          <input type="color" name="accent" defaultValue={values.accent} className="h-10 w-20 rounded-md border border-line" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t('ink')}</span>
          <input type="color" name="ink" defaultValue={values.ink} className="h-10 w-20 rounded-md border border-line" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t('headingFont')}</span>
          <select name="headingFont" defaultValue={values.headingFont} className={input}>
            {CARD_FONTS.map((f) => (
              <option key={f} value={f}>
                {t(`fonts.${f}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t('bodyFont')}</span>
          <select name="bodyFont" defaultValue={values.bodyFont} className={input}>
            {CARD_FONTS.map((f) => (
              <option key={f} value={f}>
                {t(`fonts.${f}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t('align')}</span>
          <select name="align" defaultValue={values.align} className={input}>
            <option value="top">{t('alignTop')}</option>
            <option value="center">{t('alignCenter')}</option>
            <option value="bottom">{t('alignBottom')}</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t('inset')}</span>
          <input name="insetMm" type="number" min={0} max={50} defaultValue={values.insetMm} dir="ltr" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t('scale')}</span>
          <input name="scale" type="number" min={60} max={160} step={5} defaultValue={values.scale} dir="ltr" className={input} />
        </label>
        <div className="sm:col-span-2">
          <SubmitButton>{t('save')}</SubmitButton>
        </div>
      </ActionForm>
      {current ? (
        <ActionForm action={themeCardSideAction} className="mt-3">
          <input type="hidden" name="id" value={themeId} />
          <input type="hidden" name="side" value={side} />
          <input type="hidden" name="restore" value="1" />
          <input type="hidden" name="ink" value={values.ink} />
          <input type="hidden" name="accent" value={values.accent} />
          <SubmitButton tone="danger">{restoreLabel}</SubmitButton>
        </ActionForm>
      ) : null}
    </details>
  );
}

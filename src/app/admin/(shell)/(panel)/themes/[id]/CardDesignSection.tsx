import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { CARD_FONTS, CARD_SIDE_DEFAULTS, themeCardDesign } from '@/server/catalog/card-design';
import type { CardDesign } from '@/server/db/schema';
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
  const resolved = await themeCardDesign(db(), themeId);
  const loaders = codeRef ? printComponents[codeRef] : undefined;
  const own = { front: !!loaders?.card, back: !!loaders?.cardBack };
  const previewable = !!resolved.front || own.front;
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
      ) : (
        <p className="text-sm text-muted">{t('noFront')}</p>
      )}

      {canManage
        ? (['front', 'back'] as const).map((side) => {
            const current = design?.[side] ?? null;
            const values = current ?? { ...CARD_SIDE_DEFAULTS, assetId: '' };
            const using = resolved[side] ? t('usingArtwork') : own[side] ? t('usingTheme') : side === 'back' ? t('usingSimpleBack') : t('usingNone');
            return (
              <details key={side} className="rounded-md border border-line p-3" data-card-side={side}>
                <summary className="cursor-pointer font-medium">
                  {t(side === 'front' ? 'editFront' : 'editBack')} <span className="text-sm font-normal text-muted">· {using}</span>
                </summary>
                <p className="mt-2 text-sm text-muted">{t(side === 'front' ? 'sizeFront' : 'sizeBack')}</p>
                <ActionForm action={themeCardSideAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={themeId} />
                  <input type="hidden" name="side" value={side} />
                  <div className="sm:col-span-2">
                    <ImageUpload name="assetId" label={t('artwork')} initial={current && resolved[side] ? { id: current.assetId, url: resolved[side]!.src } : null} />
                  </div>
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
                    {/* Keep the style fields valid for the shared action. */}
                    <input type="hidden" name="ink" value={values.ink} />
                    <input type="hidden" name="accent" value={values.accent} />
                    <SubmitButton tone="danger">{t(side === 'back' && !own.back ? 'restoreSimple' : 'restore')}</SubmitButton>
                  </ActionForm>
                ) : null}
              </details>
            );
          })
        : null}
      <p className="text-xs text-muted">{t('perInvitation')}</p>
    </Card>
  );
}

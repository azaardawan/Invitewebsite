import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { CARD_FONTS, PRODUCT_LAYOUTS, defaultLook, themeArtwork } from '@/server/catalog/card-design';
import type { CardDesign } from '@/server/db/schema';
import { ActionForm, SubmitButton } from '@/components/admin/forms';
import { Card } from '@/components/admin/bits';
import { themeExtrasLookAction } from '@/app/admin/_actions/catalog';
import { SideForm } from './CardDesignSection';

const PX_PER_MM = 96 / 25.4;
const input = 'w-full rounded-md border border-line bg-surface px-3 py-2';

/**
 * Admin → Themes → Newborn extras design. One look (colours and fonts) shared by the story, the stickers,
 * the bottle label and the platform's simple card, so they read as one set of this design; then each item
 * on its own: layout, which details it shows, its own colours if wanted, and optional artwork.
 */
export async function ProductDesignSection({
  themeId,
  themeKey,
  design,
  themeColors,
  updatedAt,
  canManage,
}: {
  themeId: string;
  themeKey: string;
  design: CardDesign | null;
  /** The design's own colours (manifest defaults): the look starts from them. */
  themeColors: Record<string, string>;
  updatedAt: Date;
  canManage: boolean;
}) {
  const t = await getTranslations('admin.catalog.productDesign');
  const tc = await getTranslations('admin.catalog.cardDesign');
  const locale = await getLocale();
  const resolved = await themeArtwork(db(), themeId);
  const look = resolved.look ?? defaultLook(themeColors);
  const src = (view: string, extra = '') => `/admin/preview/${locale}/product/${themeKey}?view=${view}${extra}&t=${updatedAt.getTime()}`;
  const sticker = Math.round(40 * PX_PER_MM);
  const bottle = { w: Math.round(215 * PX_PER_MM), h: Math.round(55 * PX_PER_MM) };
  const frame = (title: string, url: string, w: number, h: number, scale: number, round = false) => (
    <figure className="space-y-1">
      <div className={`overflow-hidden border border-line bg-white ${round ? 'rounded-full' : 'rounded-md'}`} style={{ width: Math.round(w * scale), height: Math.round(h * scale) }}>
        <iframe title={title} src={url} style={{ width: w, height: h, border: 0, transform: `scale(${scale})`, transformOrigin: '0 0' }} />
      </div>
      <figcaption className="text-center text-xs text-muted">{title}</figcaption>
    </figure>
  );
  const fontSelect = (name: string, value: string) => (
    <select name={name} defaultValue={value} className={input}>
      {CARD_FONTS.map((f) => (
        <option key={f} value={f}>
          {tc(`fonts.${f}`)}
        </option>
      ))}
    </select>
  );
  const layouts = (slot: keyof typeof PRODUCT_LAYOUTS) => PRODUCT_LAYOUTS[slot].map((value) => ({ value, label: t(`layouts.${slot}.${value}`) }));

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t('heading')}</h2>
        <p className="mt-1 text-sm text-muted">{t('intro')}</p>
      </div>
      <div className="flex flex-wrap items-end gap-4" dir="ltr">
        {frame(`${t('story')} · ${t('boy')}`, src('story'), 1080, 1920, 0.2)}
        {frame(`${t('story')} · ${t('girl')}`, src('story', '&gender=girl'), 1080, 1920, 0.2)}
        {frame(t('stickerRound'), src('sticker', '&shape=round&gender=girl'), sticker, sticker, 1.4, true)}
        {frame(t('stickerSquare'), src('sticker', '&shape=square'), sticker, sticker, 1.4)}
        {frame(t('bottle'), src('bottle'), bottle.w, bottle.h, 0.5)}
      </div>

      {canManage ? (
        <details className="rounded-md border border-line p-3" data-extras-look open={!resolved.look}>
          <summary className="cursor-pointer font-medium">
            {t('look.heading')} <span className="text-sm font-normal text-muted">· {resolved.look ? t('look.own') : t('look.fromDesign')}</span>
          </summary>
          <p className="mt-2 text-sm text-muted">{t('look.help')}</p>
          <ActionForm action={themeExtrasLookAction} className="mt-3 grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="id" value={themeId} />
            {(['paper', 'ink', 'accent'] as const).map((k) => (
              <label key={k} className="block">
                <span className="mb-1 block text-sm font-medium">{t(`look.${k}`)}</span>
                <input type="color" name={k} defaultValue={look[k]} className="h-10 w-20 rounded-md border border-line" />
              </label>
            ))}
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{tc('headingFont')}</span>
              {fontSelect('headingFont', look.headingFont)}
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{tc('bodyFont')}</span>
              {fontSelect('bodyFont', look.bodyFont)}
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-3">
              <input type="checkbox" name="babyColours" defaultChecked={look.babyColours} />
              {t('look.babyColours')}
            </label>
            <div className="sm:col-span-3">
              <SubmitButton>{t('look.save')}</SubmitButton>
            </div>
          </ActionForm>
          {resolved.look ? (
            <ActionForm action={themeExtrasLookAction} className="mt-3">
              <input type="hidden" name="id" value={themeId} />
              <input type="hidden" name="reset" value="1" />
              <SubmitButton tone="secondary">{t('look.reset')}</SubmitButton>
            </ActionForm>
          ) : null}
        </details>
      ) : null}

      {canManage
        ? (['story', 'sticker', 'bottle'] as const).map((slot) => (
            <SideForm
              key={slot}
              side={slot}
              themeId={themeId}
              current={design?.[slot] ?? null}
              resolvedSrc={resolved[slot]?.src || null}
              title={t(`edit.${slot}`)}
              using={design?.[slot] ? t('customised') : t('usingLook')}
              sizeHint={t(`size.${slot}`)}
              restoreLabel={t('restore')}
              extra={{ layouts: layouts(slot), look }}
            />
          ))
        : null}
    </Card>
  );
}

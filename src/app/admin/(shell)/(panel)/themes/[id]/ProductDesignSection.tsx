import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { themeArtwork } from '@/server/catalog/card-design';
import type { CardDesign } from '@/server/db/schema';
import { Card } from '@/components/admin/bits';
import { SideForm } from './CardDesignSection';

const PX_PER_MM = 96 / 25.4;

/**
 * Admin → Themes → Newborn extras design: the owner's artwork for the Instagram story, the chocolate sticker
 * and the water bottle label. Without artwork each uses the platform's soft design in the baby's colours.
 */
export async function ProductDesignSection({ themeId, themeKey, design, updatedAt, canManage }: { themeId: string; themeKey: string; design: CardDesign | null; updatedAt: Date; canManage: boolean }) {
  const t = await getTranslations('admin.catalog.productDesign');
  const tc = await getTranslations('admin.catalog.cardDesign');
  const locale = await getLocale();
  const resolved = await themeArtwork(db(), themeId);
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
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t('heading')}</h2>
        <p className="mt-1 text-sm text-muted">{t('intro')}</p>
      </div>
      <div className="flex flex-wrap items-end gap-4" dir="ltr">
        {frame(t('story'), src('story'), 1080, 1920, 0.2)}
        {frame(t('stickerRound'), src('sticker', '&shape=round&gender=girl'), sticker, sticker, 1.4, true)}
        {frame(t('stickerSquare'), src('sticker', '&shape=square'), sticker, sticker, 1.4)}
        {frame(t('bottle'), src('bottle'), bottle.w, bottle.h, 0.5)}
      </div>
      {canManage
        ? (['story', 'sticker', 'bottle'] as const).map((slot) => (
            <SideForm
              key={slot}
              side={slot}
              themeId={themeId}
              current={design?.[slot] ?? null}
              resolvedSrc={resolved[slot]?.src ?? null}
              title={t(`edit.${slot}`)}
              using={resolved[slot] ? tc('usingArtwork') : t('usingSoft')}
              sizeHint={t(`size.${slot}`)}
              restoreLabel={t('restore')}
            />
          ))
        : null}
    </Card>
  );
}

import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { CARD_FONTS, themeBoard } from '@/server/catalog/card-design';
import { DEFAULT_BOARD_AREA, DEFAULT_BOARD_MM } from '@/catalog/signature-board';
import { ActionForm, SubmitButton } from '@/components/admin/forms';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Card } from '@/components/admin/bits';
import { themeBoardAction } from '@/app/admin/_actions/catalog';

const input = 'w-full rounded-md border border-line bg-surface px-3 py-2';

/**
 * Admin → the design → Signature board (src/catalog/signature-board.ts): the board's artwork, its printed size, where
 * the messages go and in which inks. Until artwork is uploaded here, the board isn't offered with this design.
 */
export async function BoardDesignSection({ themeId, themeKey, updatedAt, canManage }: { themeId: string; themeKey: string; updatedAt: Date; canManage: boolean }) {
  const t = await getTranslations('admin.catalog.boardDesign');
  const locale = await getLocale();
  const board = await themeBoard(db(), themeId);
  const v = board ?? {
    widthMm: DEFAULT_BOARD_MM.width,
    heightMm: DEFAULT_BOARD_MM.height,
    area: DEFAULT_BOARD_AREA,
    inks: 'dark' as const,
    title: true,
    titleColor: '#7a5a2e',
    titleFont: 'ruqaa' as const,
    font: 'vazir' as const,
  };
  const ratio = v.heightMm / v.widthMm;
  const font = (name: string, value: string) => (
    <select name={name} defaultValue={value} className={input}>
      {CARD_FONTS.map((f) => (
        <option key={f} value={f}>
          {t(`font_${f}`)}
        </option>
      ))}
    </select>
  );
  const num = (name: string, label: string, value: number, min: number, max: number, step = 1) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input type="number" name={name} defaultValue={value} min={min} max={max} step={step} className={input} dir="ltr" required />
    </label>
  );
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t('heading')}</h2>
        <p className="mt-1 text-sm text-muted">{t('intro')}</p>
      </div>
      <p className={`text-sm font-medium ${board ? 'text-[color:var(--color-success,#2f7a55)]' : 'text-muted'}`} data-board-status={board ? 'on' : 'off'}>
        {board ? t('statusOn') : t('statusOff')}
      </p>
      {board ? (
        <figure className="space-y-1" dir="ltr">
          {/* A board of sample messages on this artwork, shown small. */}
          <div className="overflow-hidden rounded-md border border-line bg-white" style={{ width: 300, height: Math.round(300 * ratio) }}>
            <iframe title={t('preview')} src={`/admin/preview/${locale}/board/${themeKey}?t=${updatedAt.getTime()}`} style={{ width: 600, height: Math.round(600 * ratio), border: 0, transform: 'scale(0.5)', transformOrigin: '0 0' }} />
          </div>
          <figcaption className="text-xs text-muted">{t('previewNote')}</figcaption>
        </figure>
      ) : null}
      {canManage ? (
        <>
          <ActionForm action={themeBoardAction} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={themeId} />
            <div className="sm:col-span-2">
              <ImageUpload name="assetId" label={t('artwork')} initial={board ? { id: board.assetId, url: board.src } : null} />
              <p className="mt-1 text-xs text-muted">{t('artworkHint')}</p>
            </div>
            {num('widthMm', t('widthMm'), v.widthMm, 200, 1500)}
            {num('heightMm', t('heightMm'), v.heightMm, 200, 1500)}
            <fieldset className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-4">
              <legend className="mb-1 text-sm font-medium">{t('area')}</legend>
              {num('top', t('top'), v.area.top, 0, 45, 0.5)}
              {num('bottom', t('bottom'), v.area.bottom, 0, 45, 0.5)}
              {num('right', t('right'), v.area.right, 0, 45, 0.5)}
              {num('left', t('left'), v.area.left, 0, 45, 0.5)}
              <p className="col-span-full text-xs text-muted">{t('areaHint')}</p>
            </fieldset>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('inks')}</span>
              <select name="inks" defaultValue={v.inks} className={input}>
                <option value="dark">{t('inksDark')}</option>
                <option value="light">{t('inksLight')}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('font')}</span>
              {font('font', v.font)}
            </label>
            <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
              <input type="checkbox" name="title" defaultChecked={v.title} />
              {t('title')}
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('titleColor')}</span>
              <input type="color" name="titleColor" defaultValue={v.titleColor} className="h-10 w-20 rounded-md border border-line" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('titleFont')}</span>
              {font('titleFont', v.titleFont)}
            </label>
            <div className="sm:col-span-2">
              <SubmitButton>{t('save')}</SubmitButton>
            </div>
          </ActionForm>
          {board ? (
            <ActionForm action={themeBoardAction}>
              <input type="hidden" name="id" value={themeId} />
              <input type="hidden" name="remove" value="1" />
              <SubmitButton tone="danger">{t('remove')}</SubmitButton>
            </ActionForm>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

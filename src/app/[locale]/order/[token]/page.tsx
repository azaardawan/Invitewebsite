import { randomBytes } from 'node:crypto';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/localized';
import type { Locale } from '@/i18n/config';
import { cardPictures, draftByToken } from '@/server/storefront/order';
import { Price } from '@/components/storefront/currency';
import { CheckoutForm } from '@/components/storefront/order/CheckoutForm';
import { OrderSteps } from '@/components/storefront/order/OrderSteps';
import { ExtrasPreview } from '@/components/storefront/order/ExtrasPreview';
import { PhotoSlots } from '@/components/storefront/order/PhotoSlots';
import { SongUpload } from '@/components/storefront/order/SongUpload';
import { songLabels } from '@/components/storefront/order/song-labels';
import { onlinePaymentsEnabled } from '@/server/payments/wayl';
import { placeOrderAction } from '../../_actions/order';

export const dynamicParams = true;

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' };

/** Review: the customer's real invitation in its theme, then contact details and confirmation. */
export default async function ReviewPage({ params }: PageProps<'/[locale]/order/[token]'>) {
  const { locale, token } = (await params) as { locale: Locale; token: string };
  setRequestLocale(locale);
  const t = await getTranslations('store');
  const common = await getTranslations('common');
  const draft = await draftByToken(token);
  if (!draft) {
    return (
      <div className="mx-auto flex max-w-[560px] flex-col items-center gap-6 px-6 py-24 text-center">
        <p className="text-lg">{t('errors.previewExpired')}</p>
        <Link href="/themes" className="inline-flex h-12 items-center rounded-full bg-accent px-7 font-semibold text-accent-ink">
          {t('catalogTitle')}
        </Link>
      </div>
    );
  }
  const previewSrc = `/p/${token}`;

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-10 lg:px-10 lg:pt-16">
      <div className="mx-auto max-w-[640px] lg:mx-0">
        <OrderSteps current={1} />
      </div>
      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-20">
        <div className="flex flex-col items-center gap-4 lg:sticky lg:top-6 lg:self-start">
          {draft.onlineInvitation ? (
            <div className="w-full max-w-[380px] rounded-[44px] bg-heading p-3 shadow-[0_30px_60px_rgb(58_21_32/0.25)]">
              <iframe data-order-preview src={previewSrc} title={t('reviewTitle')} className="block h-[640px] w-full rounded-[34px] bg-surface lg:h-[700px]" />
            </div>
          ) : (
            <>
              <iframe data-order-preview src={previewSrc} title={t('filesPreview')} className="block aspect-[9/16] w-full max-w-[380px] rounded-[18px] bg-surface shadow-[0_30px_60px_rgb(58_21_32/0.18)]" />
              <p className="max-w-[380px] text-center text-sm text-muted">{t('filesOnlyHint')}</p>
            </>
          )}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium text-accent">
            {draft.status === 'DRAFT' ? (
              <Link href={`/order/${token}/edit`} className="underline underline-offset-4">
                {t('edit')}
              </Link>
            ) : null}
            {draft.onlineInvitation ? (
              <a href={previewSrc} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                {t('openPreview')}
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[36px] leading-[1.3] font-bold text-heading lg:text-[48px]">{t('reviewTitle')}</h1>
            <p className="text-[15px] leading-relaxed text-muted">{t('reviewSubtitle')}</p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-[22px] border border-line bg-paper px-5 py-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted">{t('packageLabel')}</span>
              <span className="font-semibold text-heading">
                {localized(draft.theme.name, locale)} · {localized(draft.pkg.name, locale)}
              </span>
              {draft.onlineInvitation ? <span className="text-sm text-muted" data-online-for>{common(`onlineFor.${draft.pkg.lifetime}`)}</span> : null}
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted">{t('total')}</span>
              <span className="text-lg font-semibold text-accent">
                <Price iqd={draft.pkg.priceIqd} />
              </span>
            </div>
          </div>
          {draft.photos && draft.status === 'DRAFT' ? (
            <PhotoSlots
              previewUrl={`/p/${token}`}
              base={`/p/${token}/photos`}
              max={draft.photos.max}
              min={draft.photos.min}
              aspects={draft.photos.aspects}
              names={draft.photos.names}
              initial={draft.photos.photos}
              labels={{
                title: t('photos.title'),
                help: draft.photos.min ? t('photos.helpMin', { max: draft.photos.max, min: draft.photos.min }) : t('photos.help', { max: draft.photos.max }),
                count: t.raw('photos.count') as string,
                add: t('photos.add'),
                addMany: t('photos.addMany'),
                replace: t('photos.replace'),
                remove: t('photos.remove'),
                adjust: t('photos.adjust'),
                done: t('photos.done'),
                zoom: t('photos.zoom'),
                uploading: t('photos.uploading'),
                photo: t.raw('photos.photo') as string,
                earlier: t('photos.earlier'),
                previous: t('photos.previous'),
                later: t('photos.later'),
                next: t('photos.next'),
                inDesign: t('photos.inDesign'),
                dragHint: t('photos.dragHint'),
                errors: {
                  tooLarge: t('photos.errors.tooLarge'),
                  unsupportedImage: t('photos.errors.unsupportedImage'),
                  imageTooSmall: t('photos.errors.imageTooSmall'),
                  rateLimited: t('photos.errors.rateLimited'),
                  generic: t('photos.errors.generic'),
                },
              }}
            />
          ) : null}
          {draft.song && draft.status === 'DRAFT' && draft.onlineInvitation ? (
            <SongUpload base={`/p/${token}/music`} initial={draft.song.song} hasDesignSong={draft.song.hasDesignSong} labels={songLabels(t)} />
          ) : null}
          <ExtrasPreview
            base={`/p/${token}/extra`}
            featureKeys={draft.featureKeys}
            stickerShape={draft.current.stickerShape}
            cards={cardPictures(draft.featureKeys, draft.current.cardChoices, draft.current.cardShapes, draft.locale)}
            watermarked
            labels={{
              title: t('extras.title'),
              note: t('extras.watermarkNote'),
              card: t('extras.card'),
              cardBack: t('cardBack.heading'),
              story: t('extras.story'),
              sticker: t('extras.sticker'),
              round: t('stickerShape.round'),
              square: t('stickerShape.square'),
              bottle: t('extras.bottle'),
              downloadPng: t('extras.downloadPng'),
              downloadSheet: t('extras.downloadSheet'),
            }}
          />
          <section aria-labelledby="contact-title" className="flex flex-col gap-4">
            <div>
              <h2 id="contact-title" className="text-xl font-semibold text-heading">
                {t('contactTitle')}
              </h2>
              <p className="mt-1 text-sm text-muted">{t('contactNote')}</p>
            </div>
            <CheckoutForm
              action={placeOrderAction}
              token={token}
              idempotencyKey={randomBytes(18).toString('base64url')}
              paymentNote={onlinePaymentsEnabled() ? t('paymentNext') : t('paymentSoon')}
              termsSlug={draft.termsSlug}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

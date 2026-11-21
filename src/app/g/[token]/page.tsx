import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { isLocale, localeMeta } from '@/i18n/config';
import { devicePhotos, invitationByUploadToken, uploadWindow } from '@/server/guest-photos/service';
import { currentDevice } from '@/server/guest-photos/http';
import { DEFAULT_PER_GUEST, MAX_PHOTO_BYTES } from '@/catalog/guest-photos';
import { GuestUploader } from '@/components/guest-photos/GuestUploader';

/** The page the photo QR code opens: guests type their name and send photos to the couple (owner, 2026-11-21). */
export default async function GuestUploadPage({ params }: PageProps<'/g/[token]'>) {
  await connection();
  const { token } = await params;
  const inv = await invitationByUploadToken(db(), token);
  if (!inv) notFound();
  const locale = isLocale(inv.locale) ? inv.locale : 'ar';
  const t = await getTranslations({ locale, namespace: 'guestPhotos' });
  const brand = (await getTranslations({ locale, namespace: 'common' }))('brand');
  const window = await uploadWindow(db(), inv);
  const device = await currentDevice(token);
  const mine = device ? await devicePhotos(db(), inv.id, device) : [];
  const v = inv.fieldValues;
  const names = [v.person_1_name, v.person_2_name].filter(Boolean).join(' & ') || v.baby_name || '';
  const day = (d: Date | null) => (d ? new Intl.DateTimeFormat(localeMeta[locale].intlLocale, { dateStyle: 'full', timeZone: 'Asia/Baghdad' }).format(d) : '');
  const status = window.open ? 'open' : !window.live || (window.closesAt && window.closesAt <= new Date()) ? 'closed' : 'notYet';
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <header className="bg-[linear-gradient(160deg,#3d2a22,#6e1f33)] px-6 pt-10 pb-8 text-center text-accent-ink">
        <p className="text-sm opacity-90">{t('shareWith')}</p>
        <h1 className="font-display text-[34px] leading-tight font-bold">{names}</h1>
        <p className="mt-1 text-sm opacity-90">{t('onlyThey')}</p>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 py-5">
        <GuestUploader
          token={token}
          status={status}
          share={inv.guestPhotosPerGuest ?? DEFAULT_PER_GUEST}
          maxBytes={MAX_PHOTO_BYTES}
          initial={mine.map((p) => ({ id: p.id, thumb: Boolean(p.thumbKey) }))}
          initialName={mine[0]?.guestName ?? ''}
          labels={{
            name: t('name'),
            namePlaceholder: t('namePlaceholder'),
            take: t('take'),
            choose: t('choose'),
            yours: t('yours'),
            count: t.raw('count') as string,
            remove: t('remove'),
            removeHint: window.closesAt ? t('removeUntil', { date: day(window.closesAt) }) : '',
            sending: t('sending'),
            needName: t('needName'),
            notYet: t('notYet', { date: day(window.opensAt) }),
            closed: t('closed'),
            noPicture: t('noPicture'),
            errors: {
              full: t('errors.full'),
              shareUsed: t('errors.shareUsed'),
              duplicate: t('errors.duplicate'),
              tooBig: t('errors.tooBig'),
              type: t('errors.type'),
              closed: t('closed'),
              name: t('needName'),
              rateLimited: t('errors.rateLimited'),
              generic: t('errors.generic'),
            },
          }}
        />
        <p className="text-xs leading-relaxed text-muted">{t('consent')}</p>
        <p className="mt-auto pt-6 text-center font-display text-lg text-accent">{brand}</p>
      </div>
    </main>
  );
}

import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { listMusic } from '@/server/catalog/music';
import { localized } from '@/server/catalog/common';
import { publicMediaUrl } from '@/server/storage';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import { MusicUploadForm } from '@/components/admin/MusicUploadForm';
import { Badge, Card } from '@/components/admin/bits';
import { createMusicAction, musicStatusAction, renameMusicAction } from '../../_actions/catalog';

function duration(seconds: number | null) {
  if (!seconds) return '—';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default async function MusicPage() {
  await requireAdmin({ permission: 'music.manage' });
  const t = await getTranslations('admin.catalog');
  const locale = await getLocale();
  const tracks = await listMusic(db());

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t('music.heading')}</h1>
        <p className="mt-1 text-muted">{t('music.intro')}</p>
      </header>

      <ul className="space-y-3">
        {tracks.map(({ track, asset, themes }) => (
          <li key={track.id}>
            <Card className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {track.title} {track.status === 'ARCHIVED' ? <Badge status="ARCHIVED">{t('common.archived')}</Badge> : null}
                </p>
                <span className="text-sm text-muted">
                  {t('music.duration')}: <span dir="ltr">{duration(asset.durationSeconds)}</span>
                </span>
              </div>
              <audio controls preload="none" src={publicMediaUrl(asset.storageKey)} className="w-full" />
              <p className="text-sm">
                {t('music.assignedTo')}:{' '}
                {themes.length
                  ? themes.map((th, i) => (
                      <span key={th.id}>
                        {i ? '، ' : ''}
                        <Link href={`/admin/themes/${th.id}`} className="underline">
                          {localized(th.name, locale)}
                        </Link>
                      </span>
                    ))
                  : t('music.notAssigned')}
              </p>
              <details>
                <summary className="cursor-pointer text-sm text-accent">{t('common.edit')}</summary>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <ActionForm action={renameMusicAction} className="flex items-end gap-2">
                    <input type="hidden" name="id" value={track.id} />
                    <Field label={t('music.rename')} name="title" defaultValue={track.title} />
                    <SubmitButton tone="secondary">{t('common.save')}</SubmitButton>
                  </ActionForm>
                  <ActionForm action={musicStatusAction} confirmMessage={t('common.confirm')}>
                    <input type="hidden" name="id" value={track.id} />
                    <input type="hidden" name="status" value={track.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'} />
                    <SubmitButton tone={track.status === 'ACTIVE' ? 'danger' : 'secondary'}>
                      {track.status === 'ACTIVE' ? t('common.archive') : t('common.restore')}
                    </SubmitButton>
                  </ActionForm>
                </div>
              </details>
            </Card>
          </li>
        ))}
      </ul>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t('music.add')}</h2>
        <MusicUploadForm action={createMusicAction} />
      </Card>
    </div>
  );
}

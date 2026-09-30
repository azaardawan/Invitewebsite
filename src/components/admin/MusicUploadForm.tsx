'use client';

import { startTransition, useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FormStatus, type FormAction } from './forms';

/** Uploads the MP3 first (validated server-side), then creates the library entry. */
export function MusicUploadForm({ action }: { action: FormAction }) {
  const t = useTranslations('admin.catalog');
  const [state, formAction, pending] = useActionState(action, {});
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get('file');
    if (!(file instanceof File) || !file.size) return;
    setBusy(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.set('kind', 'audio');
      body.set('file', file);
      const res = await fetch('/admin/api/upload', { method: 'POST', body });
      const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !json.id) {
        setUploadError(t.has(`errors.${json.error}` as never) ? t(`errors.${json.error}` as never) : t('errors.uploadFailed'));
        return;
      }
      const fd = new FormData();
      fd.set('title', String(data.get('title') ?? ''));
      fd.set('assetId', json.id);
      startTransition(() => formAction(fd));
      form.reset();
    } catch {
      setUploadError(t('errors.uploadFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t('music.title')}</span>
        <input name="title" required maxLength={120} className="w-full rounded-md border border-line bg-surface px-3 py-2" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t('music.file')}</span>
        <input name="file" type="file" required accept="audio/mpeg,.mp3" className="block w-full text-sm" />
        <span className="mt-1 block text-xs text-muted">{t('music.fileHint')}</span>
      </label>
      <p className="text-xs text-muted">{t('music.rightsHint')}</p>
      <button
        type="submit"
        disabled={busy || pending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink disabled:opacity-60"
      >
        {busy || pending ? t('common.uploading') : t('music.add')}
      </button>
      {uploadError ? (
        <p role="alert" className="text-sm text-danger">
          {uploadError}
        </p>
      ) : null}
      <FormStatus state={state} />
    </form>
  );
}

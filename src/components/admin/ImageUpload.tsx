'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/** Uploads an image to the admin upload endpoint and stores the resulting asset id in a hidden input. */
export function ImageUpload({ name, label, initial }: { name: string; label: string; initial?: { id: string; url: string } | null }) {
  const t = useTranslations('admin.catalog');
  const [value, setValue] = useState(initial ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set('kind', 'image');
      body.set('file', file);
      const res = await fetch('/admin/api/upload', { method: 'POST', body });
      const json = (await res.json().catch(() => ({}))) as { id?: string; url?: string; error?: string };
      if (!res.ok || !json.id || !json.url) {
        setError(t.has(`errors.${json.error}` as never) ? t(`errors.${json.error}` as never) : t('errors.uploadFailed'));
      } else {
        setValue({ id: json.id, url: json.url });
      }
    } catch {
      setError(t('errors.uploadFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={value?.id ?? ''} />
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded asset
        <img src={value.url} alt="" className="h-32 w-auto rounded-md border border-line object-cover" />
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-line bg-surface px-3 py-2 text-sm">
          {busy ? t('common.uploading') : t('common.upload')}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={busy}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        {value ? (
          <button type="button" className="text-sm text-danger" onClick={() => setValue(null)}>
            {t('common.remove')}
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

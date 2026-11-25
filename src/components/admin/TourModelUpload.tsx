'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

/** Sends a tour's .glb straight to `/admin/api/tours/<id>/model`, showing how far the upload has got. */
export function TourModelUpload({ tourId, maxMb }: { tourId: string; maxMb: number }) {
  const t = useTranslations('admin.tours');
  const tc = useTranslations('admin.catalog');
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    setDone(false);
    if (file.size > maxMb * 1024 * 1024) {
      setError(tc('errors.tooLarge'));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/admin/api/tours/${tourId}/model`);
    xhr.setRequestHeader('content-type', 'model/gltf-binary');
    xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name));
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      let code: string | undefined;
      try {
        code = (JSON.parse(xhr.responseText) as { error?: string }).error;
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        setDone(true);
        router.refresh();
      } else setError(code && tc.has(`errors.${code}` as never) ? tc(`errors.${code}` as never) : tc('errors.uploadFailed'));
    };
    xhr.onerror = () => {
      setProgress(null);
      setError(tc('errors.uploadFailed'));
    };
    setProgress(0);
    xhr.send(file);
  }

  return (
    <div className="space-y-2">
      <label className="inline-block cursor-pointer rounded-md border border-line bg-surface px-3 py-2 text-sm">
        {progress !== null ? `${t('uploading')} ${progress}%` : t('uploadModel')}
        <input
          type="file"
          // No `accept` filter: iPhones don't know the .glb type and would grey the file out; the server checks it is a .glb.
          className="sr-only"
          disabled={progress !== null}
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
      {progress !== null ? (
        <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-line">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      <p className="text-xs text-muted">{t('modelHint', { mb: maxMb })}</p>
      {done ? (
        <p role="status" className="text-sm text-success">
          {t('modelSaved')}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** The tour's public link with a copy button (for the café's Instagram bio). */
export function CopyLink({ url }: { url: string }) {
  const t = useTranslations('admin.tours');
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <a href={url} target="_blank" rel="noreferrer" dir="ltr" className="break-all text-sm underline">
        {url}
      </a>
      <button
        type="button"
        className="rounded-md border border-line px-2 py-0.5 text-xs"
        onClick={() => {
          void navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? t('copied') : t('copy')}
      </button>
    </span>
  );
}

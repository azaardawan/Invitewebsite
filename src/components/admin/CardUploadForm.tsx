'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

/** Uploads a team-designed A5 card PDF for one invitation (validated on the server). */
export function CardUploadForm({ invitationId }: { invitationId: string }) {
  const t = useTranslations('admin.invitations');
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = new FormData(form).get('file');
    if (!(file instanceof File) || !file.size) return;
    setBusy(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.set('file', file);
      const res = await fetch(`/admin/api/documents/${invitationId}/card-upload`, { method: 'POST', body });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        const key = `cardErrors.${json.error}`;
        setMessage({ ok: false, text: t.has(key as never) ? t(key as never) : t('cardErrors.failed') });
        return;
      }
      form.reset();
      setMessage({ ok: true, text: t('cardUploaded') });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: t('cardErrors.failed') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="mb-1 block text-sm">{t('cardUploadLabel')}</span>
        <input name="file" type="file" required accept="application/pdf,.pdf" className="block text-sm" />
      </label>
      <button type="submit" disabled={busy} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink disabled:opacity-60">
        {busy ? t('cardUploading') : t('cardUpload')}
      </button>
      {message ? (
        <p role={message.ok ? 'status' : 'alert'} className={`w-full text-sm ${message.ok ? 'text-muted' : 'text-danger'}`}>
          {message.text}
        </p>
      ) : null}
    </form>
  );
}

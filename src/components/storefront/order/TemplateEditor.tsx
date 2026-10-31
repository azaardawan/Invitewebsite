'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeCoverFocus, type CoverFocus } from '@/lib/cover-focus';
import { PhotoFramer } from './PhotoSlots';

export type TemplatePhoto = { position: number; src: string; width: number; height: number; focus: CoverFocus; title: string | null; caption: string | null };
export type TemplateVideo = { src: string; poster: string; width: number; height: number; durationSeconds: number };
/** A text of the design the customer writes: its key (`field:…`, `wording:…`), name, and whether checkout needs it. */
export type TemplateText = { key: string; label: string; required: boolean; maxLength: number; multiline: boolean; value: string };

export type TemplateEditorLabels = {
  /** Above the design: "Tap any text to write it, any frame to add a photo or the video". */
  hint: string;
  texts: string;
  photos: string;
  video: string;
  preview: string;
  /** The main button: "Save and continue" on the order page, "Done" on the receipt. */
  save: string;
  saved: string;
  saving: string;
  cancel: string;
  done: string;
  next: string;
  back: string;
  /** "Write it here", in the text sheet. */
  textPlaceholder: string;
  /** Sheet for a new photo: "Add a photo" + "Choose a photo". */
  addPhoto: string;
  choosePhoto: string;
  /** The framing step: heading, explanation, the word on the frame. */
  frameTitle: string;
  frameHint: string;
  frameCaption: string;
  dragHint: string;
  zoom: string;
  uploading: string;
  /** The words step: heading, "Title", "A few words". */
  wordsTitle: string;
  photoTitle: string;
  photoCaption: string;
  replacePhoto: string;
  reframe: string;
  removePhoto: string;
  /** The video sheet. */
  videoTitle: string;
  videoHint: string;
  chooseVideo: string;
  replaceVideo: string;
  removeVideo: string;
  converting: string;
  /** Checkout needs these: "Still missing: {list}". */
  missing: string;
  errors: Record<string, string> & { generic: string };
};

type Sheet =
  | { kind: 'text'; text: TemplateText }
  | { kind: 'photo-add'; index: number }
  | { kind: 'photo-frame'; index: number; isNew: boolean }
  | { kind: 'photo-words'; index: number }
  | { kind: 'video' };

/** The photo the browser sends: at most this many pixels on the long side, as JPEG (quick on mobile data). */
const SEND_MAX_SIDE = 2400;
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, SEND_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.type === 'image/jpeg' && file.size < 1_500_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.9));
  } catch {
    return file;
  }
}

/**
 * The template editor (designs with manifest `editor: 'template'`): the design itself, empty at first, which the
 * customer fills in place. A tap on a text opens a box to write it; a tap on the next empty frame adds a photo, framed
 * in exactly that frame's shape and then given a title and a few words; a tap on the video adds the one video.
 * Everything is saved as it is done (`base`/text, /photos/<n>, /video) and the design redraws at once. The bar at the
 * bottom shows what is filled and leads on (`onSave`'s link) or to a full preview.
 */
export function TemplateEditor({
  base,
  designUrl,
  previewUrl,
  continueHref,
  texts: initialTexts,
  photos: initialPhotos,
  maxPhotos,
  aspects,
  names,
  video: initialVideo,
  videoIncluded,
  labels,
}: {
  /** `/p/<token>` while ordering, `/r/<token>` after publishing. */
  base: string;
  /** The design in editing mode (`…?edit=1`). */
  designUrl: string;
  /** The design as guests will see it (new tab). */
  previewUrl: string;
  /** Where "Save" leads: the checkout below (`#checkout`) or back to the receipt. */
  continueHref: string;
  texts: TemplateText[];
  photos: TemplatePhoto[];
  maxPhotos: number;
  aspects: number[];
  names: (string | null)[];
  video: TemplateVideo | null;
  videoIncluded: boolean;
  labels: TemplateEditorLabels;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [texts, setTexts] = useState(initialTexts);
  const [photos, setPhotos] = useState(() => [...initialPhotos].sort((a, b) => a.position - b.position));
  const [video, setVideo] = useState(initialVideo);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(0);
  const [progress, setProgress] = useState<number | null>(null);

  const tell = useCallback((message: unknown) => frame.current?.contentWindow?.postMessage(message, window.location.origin), []);
  const sendPhotos = useCallback(
    (list: TemplatePhoto[]) => tell({ type: 'bahja:photos', photos: list.map(({ src, width, height, focus, title, caption }) => ({ src, width, height, focus, title, caption })) }),
    [tell],
  );
  const errorText = (code: string | undefined) => (code && labels.errors[code]) || labels.errors.generic;

  // Taps in the design ask for an edit.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const m = e.data as { type?: string; kind?: string; key?: string; index?: number };
      if (m?.type !== 'bahja:edit') return;
      setError(null);
      if (m.kind === 'text' && typeof m.key === 'string') {
        const text = texts.find((t) => t.key === m.key);
        if (text) setSheet({ kind: 'text', text });
      } else if (m.kind === 'photo' && typeof m.index === 'number' && m.index >= 0 && m.index < maxPhotos) {
        const has = photos.some((p) => p.position === m.index);
        // Photos fill the places in order: an empty frame takes the next photo.
        setSheet(has ? { kind: 'photo-words', index: m.index } : { kind: 'photo-add', index: Math.min(m.index, photos.length) });
      } else if (m.kind === 'video' && videoIncluded) {
        setSheet({ kind: 'video' });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [texts, photos, maxPhotos, videoIncluded]);

  // The page behind stays still while a sheet is open; Escape closes it.
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheet]);

  async function saveText(key: string, value: string, done = true) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${base}/text`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) });
      const data = (await res.json().catch(() => ({}))) as { value?: string; error?: string };
      if (!res.ok || typeof data.value !== 'string') {
        setError(errorText(data.error));
        return false;
      }
      const shown = data.value;
      if (key.startsWith('photo:')) {
        const [, n, part] = key.split(':');
        setPhotos((list) => {
          const next = list.map((p) => (p.position === Number(n) ? { ...p, [part as 'title' | 'caption']: value.trim() || null } : p));
          sendPhotos(next);
          return next;
        });
      } else {
        setTexts((list) => list.map((t) => (t.key === key ? { ...t, value: key.startsWith('field:') ? shown : value.trim() } : t)));
        tell({ type: 'bahja:text', key, value: shown });
      }
      setSavedAt(Date.now());
      if (done) setSheet(null);
      return true;
    } catch {
      setError(labels.errors.generic);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File, index: number) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', await shrink(file), 'photo.jpg');
      const res = await fetch(`${base}/photos/${index}`, { method: 'POST', body });
      const data = (await res.json().catch(() => ({}))) as { photo?: TemplatePhoto; error?: string };
      if (!res.ok || !data.photo) {
        setError(errorText(data.error));
        return;
      }
      const saved = { ...data.photo, title: data.photo.title ?? null, caption: data.photo.caption ?? null };
      // A replaced photo keeps its title and words (they stay on the server too).
      const before = photos.find((p) => p.position === saved.position);
      const merged = before ? { ...saved, title: before.title, caption: before.caption } : saved;
      const next = [...photos.filter((p) => p.position !== merged.position), merged].sort((a, b) => a.position - b.position);
      setPhotos(next);
      sendPhotos(next);
      tell({ type: 'bahja:show-photo', index: merged.position });
      setSavedAt(Date.now());
      setSheet({ kind: 'photo-frame', index: merged.position, isNew: !before });
    } catch {
      setError(labels.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(index: number) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${base}/photos/${index}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new Error();
      // The photos after it move up a place, as on the server.
      const next = photos.filter((p) => p.position !== index).map((p) => (p.position > index ? { ...p, position: p.position - 1 } : p));
      setPhotos(next);
      sendPhotos(next);
      setSavedAt(Date.now());
      setSheet(null);
    } catch {
      setError(labels.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  const setFocus = useCallback(
    (index: number, focus: CoverFocus) =>
      setPhotos((list) => {
        const next = list.map((p) => (p.position === index ? { ...p, focus } : p));
        sendPhotos(next);
        return next;
      }),
    [sendPhotos],
  );
  const saveFocus = useCallback(
    (index: number, focus: CoverFocus) =>
      void fetch(`${base}/photos/${index}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(focus) })
        .then(() => setSavedAt(Date.now()))
        .catch(() => {}),
    [base],
  );

  function uploadVideo(file: File) {
    setBusy(true);
    setError(null);
    // XMLHttpRequest for the upload's progress (a minute of video can take a while on mobile data).
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${base}/video`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setBusy(false);
      setProgress(null);
      let data: { video?: TemplateVideo; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText) as typeof data;
      } catch {
        // Not JSON (a proxy's error page): the generic message below.
      }
      if (xhr.status >= 300 || !data.video) {
        setError(errorText(data.error));
        return;
      }
      setVideo(data.video);
      tell({ type: 'bahja:video', video: data.video });
      setSavedAt(Date.now());
    };
    xhr.onerror = () => {
      setBusy(false);
      setProgress(null);
      setError(labels.errors.generic);
    };
    xhr.send(file);
  }

  async function removeVideo() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${base}/video`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new Error();
      setVideo(null);
      tell({ type: 'bahja:video', video: null });
      setSavedAt(Date.now());
    } catch {
      setError(labels.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  const missing = texts.filter((t) => t.required && !t.value.trim()).map((t) => t.label);
  const filledTexts = texts.filter((t) => t.value.trim()).length;
  const aspectOf = (i: number) => aspects[i] ?? aspects[0] ?? 0.75;
  const current = sheet && 'index' in sheet ? photos.find((p) => p.position === sheet.index) : undefined;

  return (
    <section className="flex flex-col gap-3" data-template-editor aria-label={labels.hint}>
      <p className="rounded-2xl bg-accent/10 px-4 py-3 text-sm font-medium text-heading">{labels.hint}</p>
      <div className="relative overflow-hidden rounded-[22px] border border-line bg-black shadow-[0_30px_60px_rgb(58_21_32/0.2)]">
        <iframe
          ref={frame}
          data-template-design
          data-order-preview
          src={designUrl}
          title={labels.hint}
          className="block h-[78svh] min-h-[560px] w-full border-0 lg:h-[760px]"
          onLoad={() => {
            sendPhotos(photos);
            tell({ type: 'bahja:video', video });
            for (const t of texts) if (t.value) tell({ type: 'bahja:text', key: t.key, value: t.value });
          }}
        />
      </div>

      {/* What is filled so far, and the way on. */}
      <div className="sticky bottom-3 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[20px] border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur" data-template-bar>
        <span className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
          <span data-template-texts={filledTexts}>
            {labels.texts} <b className="text-heading">{filledTexts}</b>/{texts.length}
          </span>
          <span data-template-photos={photos.length}>
            {labels.photos} <b className="text-heading">{photos.length}</b>/{maxPhotos}
          </span>
          {videoIncluded ? (
            <span data-template-video={video ? 'yes' : 'no'}>
              {labels.video} <b className="text-heading">{video ? '✓' : '0/1'}</b>
            </span>
          ) : null}
          {savedAt ? (
            <span className="text-success" role="status">
              {busy ? labels.saving : labels.saved}
            </span>
          ) : null}
        </span>
        <span className="ms-auto flex gap-2">
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-accent px-4 py-2 text-sm font-semibold text-accent">
            {labels.preview}
          </a>
          <a href={continueHref} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink" data-template-save>
            {labels.save}
          </a>
        </span>
        {missing.length ? (
          <p className="w-full text-xs text-danger" data-template-missing>
            {labels.missing.replace('{list}', missing.join('، '))}
          </p>
        ) : null}
      </div>

      {sheet ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => !busy && setSheet(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[92svh] w-full max-w-[520px] flex-col gap-4 overflow-y-auto rounded-t-[26px] bg-surface p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[26px]"
            onClick={(e) => e.stopPropagation()}
            data-template-sheet={sheet.kind}
          >
            {error ? (
              <p role="alert" className="rounded-xl bg-danger/10 px-4 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}

            {sheet.kind === 'text' ? (
              <TextSheet key={sheet.text.key} text={sheet.text} busy={busy} labels={labels} onCancel={() => setSheet(null)} onSave={(v) => void saveText(sheet.text.key, v)} />
            ) : null}

            {sheet.kind === 'photo-add' ? (
              <>
                <h2 className="text-lg font-semibold text-heading">{names[sheet.index] ?? labels.addPhoto}</h2>
                <div className="mx-auto grid w-full place-items-center rounded-xl border-2 border-dashed border-accent/60 bg-paper text-accent" style={{ aspectRatio: String(aspectOf(sheet.index)), maxWidth: aspectOf(sheet.index) >= 1 ? 340 : 220 }}>
                  {busy ? labels.uploading : '+'}
                </div>
                <label className="flex cursor-pointer justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-ink">
                  {labels.choosePhoto}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    data-template-photo-input
                    disabled={busy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadPhoto(f, sheet.index);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button type="button" className="text-sm text-muted underline" onClick={() => setSheet(null)}>
                  {labels.cancel}
                </button>
              </>
            ) : null}

            {sheet.kind === 'photo-frame' && current ? (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-heading">{labels.frameTitle}</h2>
                  <p className="mt-1 text-sm text-muted">{labels.frameHint}</p>
                </div>
                <PhotoFramer
                  photo={current}
                  aspect={aspectOf(current.position)}
                  focus={current.focus}
                  onFocus={(f) => setFocus(current.position, normalizeCoverFocus(f))}
                  onCommit={(f) => saveFocus(current.position, f)}
                  busy={busy}
                  labels={{ dragHint: labels.dragHint, zoom: labels.zoom, uploading: labels.uploading }}
                  caption={labels.frameCaption}
                />
                <button type="button" className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-ink" onClick={() => setSheet({ kind: 'photo-words', index: current.position })}>
                  {sheet.isNew ? labels.next : labels.done}
                </button>
              </>
            ) : null}

            {sheet.kind === 'photo-words' && current ? (
              <PhotoWords
                key={current.position}
                photo={current}
                aspect={aspectOf(current.position)}
                busy={busy}
                labels={labels}
                onReframe={() => setSheet({ kind: 'photo-frame', index: current.position, isNew: false })}
                onReplace={(f) => void uploadPhoto(f, current.position)}
                onRemove={() => void removePhoto(current.position)}
                onSave={async (title, caption) => {
                  const okTitle = title === (current.title ?? '') || (await saveText(`photo:${current.position}:title`, title, false));
                  const okCaption = caption === (current.caption ?? '') || (await saveText(`photo:${current.position}:caption`, caption, false));
                  if (okTitle && okCaption) setSheet(null);
                }}
              />
            ) : null}

            {sheet.kind === 'video' ? (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-heading">{labels.videoTitle}</h2>
                  <p className="mt-1 text-sm text-muted">{labels.videoHint}</p>
                </div>
                {video ? (
                  <video src={video.src} poster={video.poster} controls playsInline className="mx-auto max-h-[40svh] w-full rounded-xl bg-black object-contain" data-template-video-player />
                ) : null}
                {busy ? (
                  <p className="text-center text-sm font-medium text-heading" role="status">
                    {progress !== null && progress < 100 ? `${labels.uploading} ${progress}%` : labels.converting}
                  </p>
                ) : null}
                <label className={`flex cursor-pointer justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-ink ${busy ? 'pointer-events-none opacity-50' : ''}`}>
                  {video ? labels.replaceVideo : labels.chooseVideo}
                  <input
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    data-template-video-input
                    disabled={busy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadVideo(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                <div className="flex items-center justify-between text-sm">
                  {video ? (
                    <button type="button" className="text-danger underline" disabled={busy} onClick={() => void removeVideo()}>
                      {labels.removeVideo}
                    </button>
                  ) : (
                    <span />
                  )}
                  <button type="button" className="font-semibold text-accent underline" disabled={busy} onClick={() => setSheet(null)}>
                    {labels.done}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TextSheet({ text, busy, labels, onCancel, onSave }: { text: TemplateText; busy: boolean; labels: TemplateEditorLabels; onCancel: () => void; onSave: (value: string) => void }) {
  const [value, setValue] = useState(text.value);
  const cls = 'w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15';
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(value);
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="text-lg font-semibold text-heading">{text.label}</span>
        {text.multiline ? (
          <textarea autoFocus rows={5} maxLength={text.maxLength} value={value} placeholder={labels.textPlaceholder} onChange={(e) => setValue(e.target.value)} className={cls} data-template-text-input />
        ) : (
          <input autoFocus maxLength={text.maxLength} value={value} placeholder={labels.textPlaceholder} onChange={(e) => setValue(e.target.value)} className={cls} data-template-text-input />
        )}
        <span className="text-end text-xs text-muted" dir="ltr">
          {Array.from(value).length}/{text.maxLength}
        </span>
      </label>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm text-muted">
          {labels.cancel}
        </button>
        <button type="submit" disabled={busy} className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-50" data-template-text-save>
          {busy ? labels.saving : labels.done}
        </button>
      </div>
    </form>
  );
}

function PhotoWords({
  photo,
  aspect,
  busy,
  labels,
  onReframe,
  onReplace,
  onRemove,
  onSave,
}: {
  photo: TemplatePhoto;
  aspect: number;
  busy: boolean;
  labels: TemplateEditorLabels;
  onReframe: () => void;
  onReplace: (file: File) => void;
  onRemove: () => void;
  onSave: (title: string, caption: string) => void;
}) {
  const [title, setTitle] = useState(photo.title ?? '');
  const [caption, setCaption] = useState(photo.caption ?? '');
  const cls = 'w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15';
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(title, caption);
      }}
    >
      <h2 className="text-lg font-semibold text-heading">{labels.wordsTitle}</h2>
      <button type="button" onClick={onReframe} className="relative mx-auto block w-full overflow-hidden rounded-xl border border-line" style={{ aspectRatio: String(aspect), maxWidth: aspect >= 1 ? 260 : 150 }} aria-label={labels.reframe}>
        {/* eslint-disable-next-line @next/next/no-img-element -- the customer's own photo */}
        <img src={photo.src} alt="" className="size-full object-cover" style={{ objectPosition: `${photo.focus.x}% ${photo.focus.y}%`, ...(photo.focus.zoom > 1 ? { transform: `scale(${photo.focus.zoom})`, transformOrigin: `${photo.focus.x}% ${photo.focus.y}%` } : {}) }} />
      </button>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-heading">
        {labels.photoTitle}
        <input maxLength={40} value={title} onChange={(e) => setTitle(e.target.value)} className={cls} data-template-photo-title />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-heading">
        {labels.photoCaption}
        <textarea rows={3} maxLength={240} value={caption} onChange={(e) => setCaption(e.target.value)} className={cls} data-template-photo-caption />
      </label>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
        <button type="button" className="text-accent underline" onClick={onReframe}>
          {labels.reframe}
        </button>
        <label className="cursor-pointer text-accent underline">
          {labels.replacePhoto}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onReplace(f);
              e.target.value = '';
            }}
          />
        </label>
        <button type="button" className="text-danger underline" disabled={busy} onClick={onRemove}>
          {labels.removePhoto}
        </button>
        <button type="submit" disabled={busy} className="ms-auto rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-50" data-template-photo-save>
          {busy ? labels.saving : labels.done}
        </button>
      </div>
    </form>
  );
}

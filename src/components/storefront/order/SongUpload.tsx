'use client';

import { useEffect, useRef, useState } from 'react';

export type SavedSong = { src: string; durationSeconds: number };

type Labels = {
  title: string;
  help: string;
  /** Shown while no song is added: the design's own song plays ("The design's song plays"). */
  designSong: string;
  /** When the design has no song of its own ("No song yet"). */
  noSong: string;
  yours: string;
  choose: string;
  change: string;
  remove: string;
  /** Above the start slider ("Where the song starts"). */
  start: string;
  /** e.g. "Plays from {from} to {to}" ({from} and {to} are filled in here). */
  range: string;
  /** For files the browser cannot play before sending: "The first 2 minutes will be used". */
  firstPart: string;
  listen: string;
  stop: string;
  confirm: string;
  save: string;
  cancel: string;
  /** e.g. "Sending… {percent}%" */
  uploading: string;
  preparing: string;
  errors: Record<'tooLarge' | 'unsupportedAudio' | 'confirm' | 'rateLimited' | 'generic', string>;
};

/** At most this much of the song plays (the server cuts it the same way). */
const PLAY_SECONDS = 120;
/** The largest file the server takes (a phone video of a song fits). */
const MAX_BYTES = 100 * 1024 * 1024;

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Reloads every live design on the page so it plays the new song. */
function reloadDesigns() {
  for (const frame of document.querySelectorAll<HTMLIFrameElement>('iframe[data-order-preview]')) {
    try {
      frame.contentWindow?.location.reload();
    } catch {
      // A design on another site never happens here; nothing to reload.
    }
  }
}

/**
 * The customer's own song (feature `custom_music`): they pick a song or a video from their phone, listen and choose
 * where it starts (2 minutes play), confirm they may use it, and send it (`base`, the file itself as the body). Their
 * song replaces the design's; removing it brings the design's song back.
 */
export function SongUpload({ base, initial, hasDesignSong, labels }: { base: string; initial: SavedSong | null; hasDesignSong: boolean; labels: Labels }) {
  const [song, setSong] = useState<SavedSong | null>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [unreadable, setUnreadable] = useState(false);
  const [start, setStart] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const player = useRef<HTMLAudioElement>(null);

  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);

  function pick(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (f.size > MAX_BYTES) return setError(labels.errors.tooLarge);
    setFile(f);
    setUrl(URL.createObjectURL(f));
    setDuration(null);
    setUnreadable(false);
    setStart(0);
    setConfirmed(false);
  }

  function cancel() {
    player.current?.pause();
    setPlaying(false);
    setFile(null);
    setUrl(null);
    if (input.current) input.current.value = '';
  }

  function listen() {
    const a = player.current;
    if (!a) return;
    if (playing) {
      a.pause();
      return setPlaying(false);
    }
    a.currentTime = start;
    void a.play().then(() => setPlaying(true), () => setUnreadable(true));
  }

  // The preview stops where the invitation's song will stop.
  function onTime() {
    const a = player.current;
    if (a && a.currentTime >= start + PLAY_SECONDS) {
      a.pause();
      setPlaying(false);
    }
  }

  function send() {
    if (!file) return;
    if (!confirmed) return setError(labels.errors.confirm);
    setError(null);
    player.current?.pause();
    setPlaying(false);
    setProgress(0);
    // XMLHttpRequest, not fetch, to show how much of a large video has been sent.
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${base}?start=${Math.round(start)}&confirm=1`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      const body = (() => {
        try {
          return JSON.parse(xhr.responseText) as { song?: SavedSong; error?: string };
        } catch {
          return {};
        }
      })();
      if (xhr.status === 200 && body.song) {
        setSong(body.song);
        cancel();
        reloadDesigns();
      } else {
        const code = body.error as keyof Labels['errors'] | undefined;
        setError(code && code in labels.errors ? labels.errors[code] : labels.errors.generic);
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setError(labels.errors.generic);
    };
    xhr.send(file);
  }

  async function remove() {
    setError(null);
    const res = await fetch(base, { method: 'DELETE' }).catch(() => null);
    if (!res?.ok) return setError(labels.errors.generic);
    setSong(null);
    reloadDesigns();
  }

  const end = duration === null ? null : Math.min(duration, start + PLAY_SECONDS);
  const latestStart = duration === null ? 0 : Math.max(0, Math.floor(duration - 5));

  return (
    <section aria-labelledby="song-title" className="flex flex-col gap-4 rounded-[22px] border border-line bg-paper px-5 py-5" data-song-upload data-has-song={song ? 'true' : 'false'}>
      <div>
        <h2 id="song-title" className="text-xl font-semibold text-heading">
          {labels.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{labels.help}</p>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {!file ? (
        <>
          {song ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-heading">{labels.yours}</span>
              <audio controls preload="none" src={song.src} className="w-full" data-song-saved />
            </div>
          ) : (
            <p className="text-sm text-muted">{hasDesignSong ? labels.designSong : labels.noSong}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer rounded-full border border-accent px-5 py-2 text-sm font-semibold text-accent">
              {song ? labels.change : labels.choose}
              <input ref={input} type="file" accept="audio/*,video/*" className="sr-only" data-song-input onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            {song ? (
              <button type="button" onClick={() => void remove()} className="text-sm font-medium text-danger underline">
                {labels.remove}
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3" data-song-picker>
          <p className="truncate text-sm font-medium text-heading" dir="auto">
            {file.name}
          </p>
          <audio
            ref={player}
            src={url ?? undefined}
            preload="metadata"
            className="hidden"
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d) && d > 0) setDuration(d);
            }}
            onError={() => setUnreadable(true)}
            onTimeUpdate={onTime}
            onPause={() => setPlaying(false)}
          />
          {duration !== null && !unreadable ? (
            <>
              {duration > PLAY_SECONDS ? (
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-heading">{labels.start}</span>
                  <input
                    type="range"
                    min={0}
                    max={latestStart}
                    step={1}
                    value={start}
                    onChange={(e) => setStart(Number(e.target.value))}
                    className="w-full accent-[var(--color-accent)]"
                    data-song-start
                  />
                </label>
              ) : null}
              <p className="text-sm text-muted" data-song-range>
                {labels.range.replace('{from}', clock(start)).replace('{to}', clock(end ?? 0))}
              </p>
              <button type="button" onClick={listen} className="self-start rounded-full border border-accent px-5 py-2 text-sm font-semibold text-accent">
                {playing ? labels.stop : labels.listen}
              </button>
            </>
          ) : (
            <p className="text-sm text-muted">{labels.firstPart}</p>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" data-song-confirm />
            <span>{labels.confirm}</span>
          </label>
          {progress !== null ? (
            <p role="status" className="text-sm font-medium text-heading">
              {progress < 100 ? labels.uploading.replace('{percent}', String(progress)) : labels.preparing}
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={send} className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-accent-ink" data-song-save>
                {labels.save}
              </button>
              <button type="button" onClick={cancel} className="text-sm font-medium text-muted underline">
                {labels.cancel}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

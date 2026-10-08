'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * One file on the receipt: a picture of its first page that opens the PDF, and a download button.
 * The picture may take a few seconds the first time (it is drawn on the server), so a soft
 * placeholder shows until it arrives; without a picture (an uploaded card) the tile just says PDF.
 */
export function DocumentPreview({
  title,
  imageSrc,
  openHref,
  downloadHref,
  labels,
}: {
  title: string;
  imageSrc: string | null;
  openHref: string;
  downloadHref: string;
  labels: { download: string; pdf: string };
}) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>(imageSrc ? 'loading' : 'failed');
  const img = useRef<HTMLImageElement>(null);
  // The picture may finish (or fail) before the page becomes interactive, when onLoad/onError can't fire.
  useEffect(() => {
    const el = img.current;
    if (el?.complete) setState(el.naturalWidth > 0 ? 'ready' : 'failed');
  }, []);
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <figcaption className="text-center text-sm font-semibold">{title}</figcaption>
      <a
        href={openHref}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-[210/297] overflow-hidden rounded-lg border border-line bg-canvas shadow-[0_6px_18px_rgb(0_0_0/0.08)] transition hover:shadow-[0_8px_24px_rgb(0_0_0/0.14)]"
      >
        {imageSrc && state !== 'failed' ? (
          // eslint-disable-next-line @next/next/no-img-element -- private, uncached image from our own route
          <img
            ref={img}
            src={imageSrc}
            alt={title}
            onLoad={() => setState('ready')}
            onError={() => setState('failed')}
            className={`size-full object-contain transition-opacity ${state === 'ready' ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null}
        {state !== 'ready' ? (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted">
            {state === 'loading' ? (
              <span aria-hidden className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            ) : (
              <>
                <span aria-hidden className="text-3xl">📄</span>
                <span className="font-semibold">{labels.pdf}</span>
              </>
            )}
          </span>
        ) : null}
      </a>
      <a
        href={downloadHref}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-accent px-3 py-2 text-center text-xs font-semibold text-accent sm:text-sm"
      >
        {labels.download}
      </a>
    </figure>
  );
}

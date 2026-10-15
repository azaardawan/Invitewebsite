'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * One file on the receipt: a picture that opens the PDF, and a download button. The picture may take a
 * few seconds the first time (it is drawn on the server), so a soft placeholder shows until it arrives;
 * without a picture (an uploaded card) the tile just says PDF. With `back` (the printable card), a button
 * turns the card over: it flips in 3D from the portrait front to the landscape back and back again.
 */
export function DocumentPreview({
  title,
  imageSrc,
  back,
  openHref,
  downloadHref,
  labels,
}: {
  title: string;
  imageSrc: string | null;
  back?: { src: string; title: string };
  openHref: string;
  downloadHref: string;
  labels: { download: string; pdf: string; flip?: string };
}) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [angle, setAngle] = useState(0);
  const [turning, setTurning] = useState(false);

  const flip = () => {
    if (turning || !back) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return setSide((s) => (s === 'front' ? 'back' : 'front'));
    // Turn to edge-on, swap the side (and its shape), then finish the turn from the other edge.
    setTurning(true);
    setAngle(90);
    window.setTimeout(() => {
      setSide((s) => (s === 'front' ? 'back' : 'front'));
      setAngle(-90);
      requestAnimationFrame(() => requestAnimationFrame(() => setAngle(0)));
      window.setTimeout(() => setTurning(false), 320);
    }, 300);
  };

  const showing = side === 'back' && back ? { src: back.src, alt: back.title, ratio: 'aspect-[210/148]' } : { src: imageSrc, alt: title, ratio: 'aspect-[148/210]' };

  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <figcaption className="text-center text-sm font-semibold">{side === 'back' && back ? back.title : title}</figcaption>
      <div className="flex min-h-0 flex-1 items-center justify-center [perspective:900px]">
        <a
          href={openHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{ transform: `rotateY(${angle}deg)`, transition: angle === -90 ? 'none' : 'transform 300ms ease-in-out' }}
          className={`relative block w-full overflow-hidden rounded-lg border border-line bg-canvas shadow-[0_6px_18px_rgb(0_0_0/0.08)] transition-shadow hover:shadow-[0_8px_24px_rgb(0_0_0/0.14)] ${showing.ratio}`}
        >
          <Picture key={showing.src ?? 'none'} src={showing.src} alt={showing.alt} pdf={labels.pdf} />
        </a>
      </div>
      {back && imageSrc ? (
        <button type="button" onClick={flip} className="inline-flex min-h-10 items-center justify-center gap-2 text-xs font-semibold text-accent sm:text-sm" aria-pressed={side === 'back'}>
          <span aria-hidden>↻</span>
          {labels.flip}
        </button>
      ) : null}
      <a
        href={downloadHref}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-accent px-3 py-2 text-center text-xs font-semibold text-accent sm:text-sm"
      >
        {labels.download}
      </a>
    </figure>
  );
}

function Picture({ src, alt, pdf }: { src: string | null; alt: string; pdf: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>(src ? 'loading' : 'failed');
  const img = useRef<HTMLImageElement>(null);
  // The picture may finish (or fail) before the page becomes interactive, when onLoad/onError can't fire.
  useEffect(() => {
    const el = img.current;
    if (el?.complete) setState(el.naturalWidth > 0 ? 'ready' : 'failed');
  }, []);
  return (
    <>
      {src && state !== 'failed' ? (
        // eslint-disable-next-line @next/next/no-img-element -- private, uncached image from our own route
        <img
          ref={img}
          src={src}
          alt={alt}
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
              <span className="font-semibold">{pdf}</span>
            </>
          )}
        </span>
      ) : null}
    </>
  );
}

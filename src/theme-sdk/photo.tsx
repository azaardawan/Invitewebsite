import type { CSSProperties } from 'react';
import { coverImageStyle } from '@/lib/cover-focus';
import type { ThemePhoto } from './types';

/**
 * One of the customer's photos (`props.photos[i]`), filling its frame the way the customer placed it (moved and
 * zoomed on the order form). Give the frame its size and shape (aspect-ratio, border-radius, a mask…) with
 * `className` or the parent: the photo always covers it, cropped like CSS `object-fit: cover`, and never spills out.
 * Loads lazily (only when scrolled near) unless `eager`, so a design with many photos opens quickly; use `eager`
 * for a photo on the cover. No hooks: usable in client themes and server print companions.
 */
export function Photo({ photo, className, style, alt, eager = false }: { photo: ThemePhoto; className?: string; style?: CSSProperties; alt?: string; eager?: boolean }) {
  return (
    <span data-bahja-photo className={className} style={{ display: 'block', overflow: 'hidden', position: 'relative', ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- customer photo from the platform */}
      <img
        src={photo.src}
        alt={alt ?? photo.label ?? ''}
        width={photo.width || undefined}
        height={photo.height || undefined}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...coverImageStyle(photo.focus) }}
      />
    </span>
  );
}

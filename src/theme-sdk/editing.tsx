'use client';

import { useSyncExternalStore, type CSSProperties, type ElementType, type MouseEvent, type ReactNode } from 'react';
import { Photo } from './photo';
import type { ThemePhoto, ThemeVideo } from './types';

/**
 * Template designs (manifest `editor: 'template'`): the customer fills the design in place. The platform opens the
 * design inside its editor with editing switched on; then `<EditableText>`, `<PhotoSlot>` and `<VideoSlot>` show what
 * can be filled and, when tapped, ask the editor around them (the parent window) to edit it. Everywhere else they
 * draw the design normally. Themes never switch editing on themselves.
 */

/** Platform only (not part of the SDK index): turned on by the live host when the design is opened in the editor. */
let editing = false;
const listeners = new Set<() => void>();
export function setTemplateEditing(on: boolean) {
  editing = on;
  for (const l of listeners) l();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** True while the customer is filling the design in the editor: themes may then show every place, even empty ones. */
export function useTemplateEditing(): boolean {
  return useSyncExternalStore(subscribe, () => editing, () => false);
}

/** What a tap in the editor asks for, sent to the editor around the design (same site only). */
export type EditRequest =
  | { type: 'bahja:edit'; kind: 'text'; key: string; value: string; multiline: boolean }
  | { type: 'bahja:edit'; kind: 'photo'; index: number }
  | { type: 'bahja:edit'; kind: 'video' };

function ask(request: EditRequest) {
  if (window.parent !== window) window.parent.postMessage(request, window.location.origin);
}

/** Fills its place exactly. */
const FILL: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

/** The editor's outline around something the customer can fill. */
const OUTLINE: CSSProperties = { outline: '2px dashed rgba(255,255,255,.75)', outlineOffset: 3, cursor: 'pointer', borderRadius: 4 };

/**
 * A text the customer writes (a field such as `field:person_1_name`, or a wording line such as `wording:title`), drawn
 * as `as` (default `span`) with the design's class. Empty text draws nothing, except in the editor, where it shows
 * `placeholder` so the customer sees where it goes. `multiline` for a longer text (the story).
 */
export function EditableText({
  id,
  value,
  placeholder,
  as,
  className,
  style,
  multiline = false,
}: {
  id: `field:${string}` | `wording:${string}`;
  value: string | null | undefined;
  placeholder: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  multiline?: boolean;
}) {
  const on = useTemplateEditing();
  const Tag = as ?? 'span';
  const text = value?.trim() ?? '';
  if (!on) return text ? <Tag className={className} style={style}>{text}</Tag> : null;
  const open = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    ask({ type: 'bahja:edit', kind: 'text', key: id, value: text, multiline });
  };
  return (
    <Tag
      className={className}
      style={{ ...style, ...OUTLINE, ...(text ? null : { opacity: 0.55 }) }}
      data-bahja-edit={id}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && open(e as unknown as MouseEvent)}
    >
      {text || placeholder}
    </Tag>
  );
}

/**
 * Place `index` of the customer's photos (`photos` is `props.photos`): the photo (as `<Photo>`) when there is one. An
 * empty place draws nothing, except in the editor: photos fill the places in order (each `set` of places on its own,
 * when the design has sets: manifest `photos.set`), so the next free place of each set is an empty frame with a "+" (and
 * `label`) the customer taps to add a photo, and the places after it are faint outlines until then. In the editor a tap on a photo opens it there too (change it, move it in its frame, its title and words)
 * instead of whatever the design does on a tap.
 */
export function PhotoSlot({
  index,
  photos,
  className,
  style,
  eager,
  label,
  set,
}: {
  index: number;
  photos: readonly ThemePhoto[];
  /** The design's set size (manifest `photos.set`), when its places come in sets. */
  set?: number;
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
  label?: string;
}) {
  const on = useTemplateEditing();
  const photo = photos.find((p) => p.index === index);
  if (!on) return photo ? <Photo photo={photo} className={className} style={style} eager={eager} /> : null;
  // The next free place of this place's set (the whole design without sets).
  const first = set ? Math.floor(index / set) * set : 0;
  let free = first;
  while (photos.some((p) => p.index === free)) free++;
  if (!photo && index > free) {
    return <span aria-hidden data-bahja-photo-slot={index} className={className} style={{ ...style, display: 'block', border: '1px dashed rgba(255,255,255,.18)', background: 'rgba(255,255,255,.02)' }} />;
  }
  const open = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    ask({ type: 'bahja:edit', kind: 'photo', index });
  };
  // The place itself takes the design's frame (className/style); the photo, or the empty frame, fills it.
  return (
    <span
      data-bahja-photo-slot={index}
      role="button"
      tabIndex={0}
      onClickCapture={open}
      onKeyDown={(e) => e.key === 'Enter' && open(e as unknown as MouseEvent)}
      className={className}
      style={{ display: 'block', position: 'relative', overflow: 'hidden', cursor: 'pointer', ...style }}
    >
      {photo ? (
        <Photo photo={photo} style={FILL} eager={eager} />
      ) : (
        <span style={{ ...FILL, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.06)', border: '2px dashed rgba(255,255,255,.45)', color: 'rgba(255,255,255,.85)', textAlign: 'center' }}>
          <span style={{ display: 'grid', gap: 6, justifyItems: 'center', fontSize: 13, padding: 8 }}>
            <span aria-hidden style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid currentColor', display: 'grid', placeItems: 'center', fontSize: 26, lineHeight: 1 }}>+</span>
            {label ? <span>{label}</span> : null}
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * The customer's video (`props.video`), as a `<video>` with its still until it plays. Other `<video>` settings
 * (`autoPlay`, `muted`, `loop`, `playsInline`, `controls`) pass through. With no video it draws `fallback` (e.g. a
 * photo), except in the editor, where it is an empty frame with a "+" the customer taps to add their video; in the
 * editor a tap on the video opens it there too.
 */
export function VideoSlot({
  video,
  className,
  style,
  fallback,
  label,
  ...media
}: {
  video: ThemeVideo | null;
  className?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
  label?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
}) {
  const on = useTemplateEditing();
  const player = video ? (
    <video className={className} style={{ objectFit: 'cover', ...style }} src={video.src} poster={video.poster} width={video.width} height={video.height} preload="metadata" {...media} />
  ) : null;
  if (!on) return player ?? <>{fallback ?? null}</>;
  const open = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    ask({ type: 'bahja:edit', kind: 'video' });
  };
  return (
    <span
      data-bahja-video-slot
      role="button"
      tabIndex={0}
      onClickCapture={open}
      onKeyDown={(e) => e.key === 'Enter' && open(e as unknown as MouseEvent)}
      className={className}
      style={{ display: 'block', position: 'relative', overflow: 'hidden', cursor: 'pointer', ...style }}
    >
      {video ? (
        <video style={{ ...FILL, objectFit: 'cover' }} src={video.src} poster={video.poster} width={video.width} height={video.height} preload="metadata" {...media} />
      ) : (
        <span style={{ ...FILL, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.06)', border: '2px dashed rgba(255,255,255,.45)', color: 'rgba(255,255,255,.9)' }}>
          <span style={{ display: 'grid', gap: 8, justifyItems: 'center', fontSize: 14, padding: 8, textAlign: 'center' }}>
            <span aria-hidden style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid currentColor', display: 'grid', placeItems: 'center', fontSize: 22 }}>▶</span>
            {label ? <span>{label}</span> : null}
          </span>
        </span>
      )}
    </span>
  );
}

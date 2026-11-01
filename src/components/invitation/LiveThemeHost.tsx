'use client';

import { useEffect, useState } from 'react';
import type { ThemePhoto, ThemeProps, ThemeVideo } from '@/theme-sdk/types';
import { ThemeHost } from '@/theme-registry/loaders.generated';
import { setForcedReducedMotion } from '@/theme-sdk/runtime';
import { setTemplateEditing } from '@/theme-sdk/editing';

type LivePhoto = Omit<ThemePhoto, 'label' | 'index' | 'title' | 'caption'> & { title?: string | null; caption?: string | null; index?: number };

/** Messages from the customer's editors on the order page or the receipt (same site only). */
type LiveMessage =
  | { type: 'bahja:photos'; photos: LivePhoto[] }
  | { type: 'bahja:show-photo'; index: number }
  | { type: 'bahja:video'; video: ThemeVideo | null }
  | { type: 'bahja:text'; key: string; value: string };

/**
 * The theme, with the customer's changes kept live: the photo editor (or the template editor) sends each change as it
 * happens (a photo moved, zoomed, added, removed or reordered; a text typed; the video added) and the design redraws
 * at once, then scrolls to the photo being edited and outlines it. With `?photoEdit=1` the design starts already open
 * (no entrance), so the photos are in view; with `?edit=1` (template designs) it is also editable in place: its texts,
 * photo frames and video ask the editor around it to fill them. Messages from other sites are ignored.
 */
export function LiveThemeHost({ codeRef, props }: { codeRef: string; props: ThemeProps }) {
  const [photos, setPhotos] = useState(props.photos);
  const [video, setVideo] = useState(props.video);
  const [fields, setFields] = useState(props.fields);
  const [wording, setWording] = useState(props.wording);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const template = params.get('edit') === '1';
    const editing = template || params.get('photoEdit') === '1';
    if (editing) setForcedReducedMotion(true);
    if (template) setTemplateEditing(true);
    const show = (index: number) => {
      // After the design has drawn the change.
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(`[data-bahja-photo="${index}"], [data-bahja-photo-slot="${index}"]`);
        if (!el) return;
        el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
        el.style.outline = '3px solid #c0396b';
        el.style.outlineOffset = '2px';
        window.setTimeout(() => {
          el.style.outline = '';
          el.style.outlineOffset = '';
        }, 1600);
      });
    };
    const start = Number(params.get('photo'));
    if (editing && params.has('photo') && Number.isInteger(start)) window.setTimeout(() => show(start), 400);
    const onMessage = (e: MessageEvent<LiveMessage>) => {
      if (e.origin !== window.location.origin || !e.data || typeof e.data !== 'object') return;
      const m = e.data;
      if (m.type === 'bahja:photos' && Array.isArray(m.photos)) {
        // The design's names for each place stay as they were.
        // Each photo's place (`index`, sent by editors whose designs have sets), else its turn in the list.
        setPhotos(
          m.photos.map((p, i) => {
            const index = typeof p.index === 'number' ? p.index : i;
            return { ...p, index, label: props.photos.find((x) => x.index === index)?.label ?? props.photos[index]?.label ?? null, title: p.title ?? null, caption: p.caption ?? null };
          }),
        );
      } else if (m.type === 'bahja:show-photo' && Number.isInteger(m.index)) {
        show(m.index);
      } else if (m.type === 'bahja:video') {
        setVideo(m.video && typeof m.video.src === 'string' ? m.video : null);
      } else if (m.type === 'bahja:text' && typeof m.key === 'string' && typeof m.value === 'string') {
        const [kind, key] = m.key.split(':') as [string, string];
        if (kind === 'field') setFields((f) => ({ ...f, [key]: m.value }));
        else if (kind === 'wording') setWording((w) => ({ ...w, [key]: m.value }));
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (template) setTemplateEditing(false);
    };
  }, [props.photos]);

  return <ThemeHost codeRef={codeRef} {...props} photos={photos} video={video} fields={fields} wording={wording} />;
}

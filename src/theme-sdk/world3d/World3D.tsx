'use client';

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, type CSSProperties } from 'react';
import type { ThemePhoto, ThemeVideo } from '../types';
import { useTouchScreen, webglAvailable, Joystick } from '../gallery3d/Gallery3D';
import type { WorldPlan } from './plan';
import type { WorldEngine, WorldLook, WorldTap } from './engine';

/** What a design can ask the world to do (through a ref). */
export type World3DHandle = {
  /** Opens or closes a thing of the plan (a drawer, a lid, a door; a teleport takes the visitor there). */
  set(key: string, open: boolean): void;
  /** Plays (or pauses, when it is playing) the video at `place` on its screen; call it from a tap. */
  playVideo(place: number): void;
  pauseVideo(): void;
  muteVideo(muted: boolean): void;
  /** Stops the video and frees its memory. */
  stopVideo(): void;
};

export type World3DProps = {
  /** The design's glTF model (a `.glb`), e.g. `new URL('./assets/house.glb', import.meta.url).href`. */
  model: string;
  plan: WorldPlan;
  /** `props.photos`: each on its place; places without a photo are left out, frame and all. */
  photos: readonly ThemePhoto[];
  /** `props.videos`: each on its screen (a still with a play mark until it is played). */
  videos: readonly (ThemeVideo | null)[];
  /** The words on the plan's plates, by text key. */
  texts: Readonly<Record<string, string>>;
  /** The colour of each of the plan's paint slots (`props.colors`). */
  colors: Readonly<Record<string, string>>;
  look: WorldLook;
  dir: 'rtl' | 'ltr';
  reducedMotion: boolean;
  className?: string;
  style?: CSSProperties;
  joystickClassName?: string;
  knobClassName?: string;
  onProgress?: (share: number) => void;
  onReady?: () => void;
  /** No 3D on this device, or the model failed: the design shows its flat version instead. */
  onUnavailable?: () => void;
  /** The visitor tapped a photo, a screen or a thing of the plan: the design decides what happens. */
  onTap?: (tap: WorldTap) => void;
  onRoom?: (key: string) => void;
  onVideo?: (place: number, state: 'playing' | 'paused' | 'ended') => void;
  /** What lies in each drawer (by thing key): its note's words and its photo, drawn as paper in it. */
  contents?: Readonly<Record<string, { note?: string; photo?: ThemePhoto | null }>>;
  /** The things of the plan the visitor is next to and facing, nearest first (the design may offer a button for each). */
  onNear?: (keys: string[]) => void;
};

/**
 * A small walkable 3D world from the design's model (a house of rooms on one or more floors): the customer's photos and
 * videos on their places, names on its plates, its walls in the chosen colours. Visitors walk with the keys or the
 * on-screen joystick, look around by dragging, climb its stairs, and tap things (drawers, a gift, a door); the design
 * answers each tap (`onTap`) and opens things with the `World3DHandle`. three.js loads only when this is shown; on a
 * device without WebGL it calls `onUnavailable`.
 */
export const World3D = forwardRef<World3DHandle, World3DProps>(function World3D(props, ref) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<WorldEngine | null>(null);
  const callbacks = useRef(props);
  useLayoutEffect(() => {
    callbacks.current = props;
  });
  const touch = useTouchScreen();
  const { model, plan, photos, videos, texts, colors, look, dir, reducedMotion } = props;

  useImperativeHandle(
    ref,
    () => ({
      set: (key, open) => engine.current?.set(key, open),
      playVideo: (place) => void engine.current?.playVideo(place),
      pauseVideo: () => engine.current?.pauseVideo(),
      muteVideo: (muted) => engine.current?.muteVideo(muted),
      stopVideo: () => engine.current?.stopVideo(),
    }),
    [],
  );

  // One scene per set of photos, videos, words and colours: rebuilt only when what is shown changes.
  const key = JSON.stringify([photos.map((p) => [p.index, p.src, p.focus]), videos.map((v) => v?.src ?? null), texts, colors, plan.start, props.contents ?? null]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (!webglAvailable()) {
      callbacks.current.onUnavailable?.();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { WorldEngine } = await import('./engine');
        if (cancelled) return;
        await Promise.race([document.fonts.load(`48px ${look.font}`), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
        if (cancelled) return;
        const e = new WorldEngine({
          container: el,
          model,
          plan,
          photos: photos.map((p) => ({ index: p.index, src: p.src, focus: p.focus })),
          videos: videos.map((v) => (v ? { src: v.src, poster: v.poster } : null)),
          texts,
          colors,
          look,
          dir,
          reducedMotion,
          onProgress: (s) => callbacks.current.onProgress?.(s),
          onTap: (t) => callbacks.current.onTap?.(t),
          onRoom: (k) => callbacks.current.onRoom?.(k),
          onVideo: (p, s) => callbacks.current.onVideo?.(p, s),
          onNear: (k) => callbacks.current.onNear?.(k),
          contents: Object.fromEntries(
            Object.entries(props.contents ?? {}).map(([k, v]) => [k, { note: v.note, photo: v.photo ? { src: v.photo.src, focus: v.photo.focus } : undefined }]),
          ),
        });
        engine.current = e;
        await e.load();
        if (!cancelled) callbacks.current.onReady?.();
      } catch (err) {
        if (cancelled) return;
        console.warn('3D world unavailable', err);
        engine.current?.dispose();
        engine.current = null;
        callbacks.current.onUnavailable?.();
      }
    })();
    return () => {
      cancelled = true;
      engine.current?.dispose();
      engine.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilt when what is shown changes (the key), not on every render
  }, [model, key, dir, reducedMotion]);

  return (
    <div ref={box} className={props.className} style={{ position: 'relative', overflow: 'hidden', ...props.style }}>
      {touch ? <Joystick className={props.joystickClassName} knobClassName={props.knobClassName} onMove={(x, y) => engine.current?.setStick(x, y)} /> : null}
    </div>
  );
});

export type { WorldTap, WorldLook };

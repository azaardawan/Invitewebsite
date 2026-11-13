'use client';

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { ThemePhoto } from '../types';
import type { GalleryPlan } from './plan';
import type { EngineLook, EngineScreen, EngineSign, GalleryEngine } from './engine';

/** What a design can ask the gallery to do (through a ref). */
export type Gallery3DHandle = {
  /** Walks to the photo at place `index` (doing nothing when it isn't on a wall). */
  goToPhoto(index: number): void;
  /** Walks to the next / previous photo on the walls, after or before the one in view (wrapping round). */
  next(): void;
  previous(): void;
  /** Walks back to where visitors start. */
  goToStart(): void;
};

export type Gallery3DProps = {
  /** The design's glTF model (a `.glb`), e.g. `new URL('./assets/museum.glb', import.meta.url).href`. */
  model: string;
  plan: GalleryPlan;
  /** `props.photos`: each hangs on the spot of its place; spots without a photo are left out, frame and all. */
  photos: readonly ThemePhoto[];
  /** Each room's name on its sign, by room key (rooms without one keep a blank sign hidden). */
  signs?: Readonly<Record<string, string>>;
  /** What the model's screen shows: a picture (e.g. the video's still, with a play button), or else a title and text. */
  screen?: { image: string | null; play: boolean; title?: string; body?: string } | null;
  /** The design's typeface (a CSS font-family list, loaded on the page) and colours for the signs and the screen. */
  look: EngineLook;
  dir: 'rtl' | 'ltr';
  reducedMotion: boolean;
  className?: string;
  style?: CSSProperties;
  /** Classes for the on-screen joystick (shown on touch screens) and its knob. */
  joystickClassName?: string;
  knobClassName?: string;
  /** The model's download, 0…1. */
  onProgress?: (share: number) => void;
  onReady?: () => void;
  /** The device can't show 3D, or the model failed to load: draw the design's flat gallery instead. */
  onUnavailable?: () => void;
  /** The visitor stopped in front of a photo (its place), or walked away from it (null). */
  onView?: (index: number | null) => void;
  /** The visitor tapped the screen. */
  onScreen?: () => void;
};

const COARSE = '(pointer: coarse)';
function subscribeCoarse(cb: () => void) {
  const q = window.matchMedia(COARSE);
  q.addEventListener('change', cb);
  return () => q.removeEventListener('change', cb);
}
/** True on a touch screen (a phone or tablet): show the joystick and touch wording. False while rendering on the server. */
export function useTouchScreen(): boolean {
  return useSyncExternalStore(subscribeCoarse, () => window.matchMedia(COARSE).matches, () => false);
}

/** True when this browser can draw WebGL (most phones and computers; not some old or locked-down ones). */
export function webglAvailable(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * A walkable 3D gallery built from the design's model: the customer's photos hang on its spots, every room with a photo
 * (and the rooms on the way to it) is open, the others are walled up. Visitors walk with the keys or the on-screen
 * joystick, look around by dragging, and tap a photo to walk up to it; the design adds its own buttons with the
 * `Gallery3DHandle` (next photo, back to the start). three.js loads only when this is shown. On a device without
 * WebGL it calls `onUnavailable`: the design then shows its flat gallery (with `<Photo>`).
 */
export const Gallery3D = forwardRef<Gallery3DHandle, Gallery3DProps>(function Gallery3D(props, ref) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<GalleryEngine | null>(null);
  const viewing = useRef<number | null>(null);
  const callbacks = useRef(props);
  useLayoutEffect(() => {
    callbacks.current = props;
  });
  const touch = useTouchScreen();
  const { model, plan, photos, signs, screen, look, dir, reducedMotion } = props;

  useImperativeHandle(ref, () => {
    const order = () => engine.current?.photoOrder() ?? [];
    const step = (by: number) => {
      const list = order();
      if (!list.length) return;
      const at = viewing.current === null ? (by > 0 ? -1 : 0) : list.indexOf(viewing.current);
      engine.current?.goToPhoto(list[(at + by + list.length) % list.length]!);
    };
    return {
      goToPhoto: (i) => engine.current?.goToPhoto(i),
      next: () => step(1),
      previous: () => step(-1),
      goToStart: () => engine.current?.goToStart(),
    };
  }, []);

  // One scene per set of photos: rebuilt only when what is shown changes.
  const photoKey = photos.map((p) => `${p.index}:${p.src}:${p.focus.x},${p.focus.y},${p.focus.zoom}`).join('|');
  const signKey = JSON.stringify(signs ?? {});
  const screenKey = JSON.stringify(screen ?? null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (!webglAvailable()) {
      callbacks.current.onUnavailable?.();
      return;
    }
    let cancelled = false;
    const signTexts: Record<string, EngineSign> = Object.fromEntries(Object.entries(signs ?? {}).map(([k, text]) => [k, { text, dir }]));
    const screenSpec: EngineScreen | null = screen ? { ...screen, dir } : null;
    (async () => {
      try {
        const { GalleryEngine } = await import('./engine');
        if (cancelled) return;
        // The signs and the screen are written in the design's typeface: wait for it.
        await Promise.race([document.fonts.load(`48px ${look.font}`), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
        if (cancelled) return;
        const e = new GalleryEngine({
          container: el,
          model,
          plan,
          photos: photos.map((p) => ({ index: p.index, src: p.src, focus: p.focus })),
          signs: signTexts,
          screen: screenSpec,
          look,
          reducedMotion,
          onProgress: (s) => callbacks.current.onProgress?.(s),
          onView: (i) => {
            viewing.current = i;
            callbacks.current.onView?.(i);
          },
          onScreen: () => callbacks.current.onScreen?.(),
        });
        engine.current = e;
        await e.load();
        if (!cancelled) callbacks.current.onReady?.();
      } catch (err) {
        if (cancelled) return;
        console.warn('3D gallery unavailable', err);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilt when what is shown changes (the keys), not on every render
  }, [model, photoKey, signKey, screenKey, dir, reducedMotion]);

  return (
    <div ref={box} className={props.className} style={{ position: 'relative', overflow: 'hidden', ...props.style }}>
      {touch ? <Joystick className={props.joystickClassName} knobClassName={props.knobClassName} onMove={(x, y) => engine.current?.setStick(x, y)} /> : null}
    </div>
  );
});

/** The on-screen joystick for walking on a touch screen (drag the knob; let go to stop). */
function Joystick({ className, knobClassName, onMove }: { className?: string; knobClassName?: string; onMove: (x: number, y: number) => void }) {
  const ring = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointer = useRef<number | null>(null);
  const move = (e: ReactPointerEvent) => {
    const r = ring.current!.getBoundingClientRect();
    const R = r.width / 2;
    let x = e.clientX - (r.left + R);
    let y = e.clientY - (r.top + R);
    const d = Math.hypot(x, y);
    if (d > R) {
      x *= R / d;
      y *= R / d;
    }
    setKnob({ x, y });
    onMove(x / R, y / R);
  };
  const end = () => {
    pointer.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };
  return (
    <div
      ref={ring}
      aria-hidden
      className={className}
      style={className ? { touchAction: 'none' } : { position: 'absolute', insetInlineStart: 20, bottom: 96, width: 116, height: 116, borderRadius: '50%', border: '1px solid rgba(255,255,255,.35)', background: 'rgba(0,0,0,.25)', touchAction: 'none', zIndex: 2 }}
      onPointerDown={(e) => {
        pointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => e.pointerId === pointer.current && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        className={knobClassName}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
          ...(knobClassName ? null : { width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,.85)' }),
        }}
      />
    </div>
  );
}

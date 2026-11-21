'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { Joystick, useTouchScreen, webglAvailable } from '@/theme-sdk/gallery3d/Gallery3D';
import type { TourEngine } from './tour-engine';

export type TourWords = {
  loading: string;
  hintTouch: string;
  hintKeys: string;
  noWebgl: string;
  failed: string;
  instagram: string;
  location: string;
  menu: string;
  whatsapp: string;
  credit: string;
};

export type TourLinks = { instagram?: string; location?: string; menu?: string; whatsapp?: string };

const MOTION = '(prefers-reduced-motion: reduce)';
const subscribeMotion = (cb: () => void) => {
  const q = window.matchMedia(MOTION);
  q.addEventListener('change', cb);
  return () => q.removeEventListener('change', cb);
};

const ICONS: Record<keyof TourLinks, string> = {
  instagram:
    'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm5.5-3.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z',
  location: 'M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z',
  menu: 'M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm2 8v2h8v-2H8Zm0 4v2h8v-2H8Zm0-8v2h5V6H8Z',
  whatsapp:
    'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z',
};

const GLASS: CSSProperties = { background: 'rgba(20,16,14,.58)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' };

/**
 * A café's virtual tour, full screen (owner, 2026-11-21): the walk, a small bar with the café's logo and name, its
 * buttons (Instagram, location, menu, WhatsApp; only those it has) and a small "Virtual tour by Bahja".
 */
export function TourViewer({
  name,
  logo,
  model,
  links,
  words,
  dir,
}: {
  name: string;
  logo: string | null;
  model: string;
  links: TourLinks;
  words: TourWords;
  dir: 'rtl' | 'ltr';
}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<TourEngine | null>(null);
  const touch = useTouchScreen();
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia(MOTION).matches, () => false);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'nowebgl' | 'failed'>('loading');
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    (async () => {
      try {
        if (!webglAvailable()) {
          setState('nowebgl');
          return;
        }
        const { TourEngine } = await import('./tour-engine');
        if (cancelled) return;
        const e = new TourEngine({ container: el, model, reducedMotion, onProgress: (s) => !cancelled && setProgress(s) });
        engine.current = e;
        await e.load();
        if (!cancelled) setState('ready');
      } catch (err) {
        if (cancelled) return;
        console.warn('tour unavailable', err);
        engine.current?.dispose();
        engine.current = null;
        setState('failed');
      }
    })();
    return () => {
      cancelled = true;
      engine.current?.dispose();
      engine.current = null;
    };
  }, [model, reducedMotion]);

  // The hint goes once the visitor has had time to read it (or starts walking).
  useEffect(() => {
    if (state !== 'ready') return;
    const t = setTimeout(() => setHint(false), 6000);
    return () => clearTimeout(t);
  }, [state]);

  const buttons = (Object.keys(ICONS) as (keyof TourLinks)[]).filter((k) => links[k]);

  return (
    <div
      dir={dir}
      style={{ position: 'fixed', inset: 0, background: '#1a1613', color: '#fff', fontFamily: 'system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif', overflow: 'hidden' }}
    >
      <div ref={box} data-testid="tour-canvas" data-state={state} style={{ position: 'absolute', inset: 0 }} onPointerDown={() => setHint(false)}>
        {touch && state === 'ready' ? (
          <Joystick
            onMove={(x, y) => {
              setHint(false);
              engine.current?.setStick(x, y);
            }}
          />
        ) : null}
      </div>

      {/* Until the place is there (or when it can't be shown): the café's logo and name; its buttons stay below. */}
      {state !== 'ready' ? (
        <div role="status" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: '#1a1613', padding: 24, textAlign: 'center' }}>
          <div style={{ display: 'grid', gap: 14, justifyItems: 'center', maxWidth: 320 }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- the café's own logo
              <img src={logo} alt="" width={72} height={72} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', background: '#fff' }} />
            ) : null}
            <p style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{name}</p>
            {state === 'loading' ? (
              <>
                <div style={{ width: 200, height: 4, borderRadius: 4, background: 'rgba(255,255,255,.18)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round(progress * 100)}%`, height: '100%', background: '#fff', transition: 'width .2s' }} />
                </div>
                <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>{words.loading}</p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 14, opacity: 0.85, lineHeight: 1.6 }}>{state === 'nowebgl' ? words.noWebgl : words.failed}</p>
            )}
          </div>
        </div>
      ) : null}

      {/* The café's bar. */}
      {state === 'ready' ? (
        <header
          style={{
            ...GLASS,
            position: 'absolute',
            top: 'max(12px, env(safe-area-inset-top))',
            insetInline: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            borderRadius: 14,
            pointerEvents: 'none',
            maxWidth: 520,
            marginInline: 'auto',
          }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- the café's own logo
            <img src={logo} alt="" width={36} height={36} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', background: '#fff', flex: 'none' }} />
          ) : null}
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 600, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</h1>
        </header>
      ) : null}

      {/* Its buttons, and the credit. */}
      <footer
        style={{
          position: 'absolute',
          bottom: 'max(10px, env(safe-area-inset-bottom))',
          insetInline: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {buttons.length ? (
          <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, pointerEvents: 'auto' }}>
            {buttons.map((k) => (
              <a
                key={k}
                href={links[k]}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...GLASS,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: 40,
                  padding: '8px 14px',
                  borderRadius: 999,
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden>
                  <path d={ICONS[k]} fillRule="evenodd" />
                </svg>
                {words[k]}
              </a>
            ))}
          </nav>
        ) : null}
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          style={{ ...GLASS, pointerEvents: 'auto', fontSize: 11, color: 'rgba(255,255,255,.9)', textDecoration: 'none', padding: '3px 10px', borderRadius: 999 }}
        >
          {words.credit}
        </Link>
      </footer>

      {state === 'ready' && hint ? (
        <p
          role="status"
          style={{
            ...GLASS,
            position: 'absolute',
            top: '50%',
            insetInline: 24,
            margin: '0 auto',
            maxWidth: 360,
            transform: 'translateY(-50%)',
            textAlign: 'center',
            padding: '10px 14px',
            borderRadius: 12,
            fontSize: 14,
            lineHeight: 1.5,
            pointerEvents: 'none',
          }}
        >
          {touch ? words.hintTouch : words.hintKeys}
        </p>
      ) : null}
    </div>
  );
}

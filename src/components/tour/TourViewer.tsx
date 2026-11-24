'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { Joystick, useTouchScreen, webglAvailable } from '@/theme-sdk/gallery3d/Gallery3D';
import type { TourActivity, TourEngine } from './tour-engine';
import type { TourEdits } from './items';

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
  rotate: string;
  seeMenu: string;
  getCoffee: string;
  getCookie: string;
  makingCoffee: string;
  makingCookie: string;
  sip: string;
  bite: string;
  sit: string;
  stand: string;
  putCoffee: string;
  putCookie: string;
  pickCoffee: string;
  pickCookie: string;
  callWaiter: string;
  waiterComing: string;
  waiterBringing: string;
  noThanks: string;
};

export type TourLinks = { instagram?: string; location?: string; menu?: string; whatsapp?: string };

const MOTION = '(prefers-reduced-motion: reduce)';
const PORTRAIT = '(orientation: portrait)';
const subscribePortrait = (cb: () => void) => {
  const q = window.matchMedia(PORTRAIT);
  q.addEventListener('change', cb);
  return () => q.removeEventListener('change', cb);
};
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
  edits,
  words,
  dir,
}: {
  name: string;
  logo: string | null;
  model: string;
  links: TourLinks;
  /** The owner's changes to the model's items (Admin → Tours → the editor). */
  edits?: TourEdits;
  words: TourWords;
  dir: 'rtl' | 'ltr';
}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<TourEngine | null>(null);
  const touch = useTouchScreen();
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia(MOTION).matches, () => false);
  // On a phone the tour is walked held sideways only (owner, 2026-11-22): upright, it asks to be turned.
  const portrait = useSyncExternalStore(subscribePortrait, () => window.matchMedia(PORTRAIT).matches, () => false);
  const upright = touch && portrait;
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'nowebgl' | 'failed'>('loading');
  const [hint, setHint] = useState(true);
  // the spot the visitor is at (e.g. the counter: its menu)
  const [spot, setSpot] = useState<string | null>(null);
  // what the visitor can do: order at the counter, sip, bite, sit, put down, pick up (owner, 2026-11-23)
  const [act, setAct] = useState<TourActivity | null>(null);

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
        const e = new TourEngine({ container: el, model, reducedMotion, edits, debug: new URLSearchParams(window.location.search).get('debug') === '1', onProgress: (s) => !cancelled && setProgress(s), onSpot: (k) => !cancelled && setSpot(k), onActivity: (a) => !cancelled && setAct(a) });
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
  }, [model, reducedMotion, edits]);

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
            style={{ insetInlineStart: 'auto', insetInlineEnd: 'auto', left: 'auto', right: 'max(24px, env(safe-area-inset-right))', bottom: 'max(28px, env(safe-area-inset-bottom))' }}
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

      {/* The café's bar along the top, in one line: its logo and name, then its buttons (owner, 2026-11-22). */}
      {state === 'ready' ? (
        <header
          style={{
            position: 'absolute',
            top: 'max(10px, env(safe-area-inset-top))',
            insetInline: 'max(10px, env(safe-area-inset-left))',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            pointerEvents: 'none',
          }}
        >
          <div style={{ ...GLASS, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 6px', paddingInlineStart: 6, borderRadius: 999, minWidth: 0, flex: '0 1 auto' }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- the café's own logo
              <img src={logo} alt="" width={30} height={30} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', background: '#fff', flex: 'none' }} />
            ) : null}
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</h1>
          </div>
          {buttons.length ? (
            <nav style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, marginInlineStart: 'auto', overflowX: 'auto', pointerEvents: 'auto', scrollbarWidth: 'none' }}>
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
                    gap: 5,
                    minHeight: 36,
                    padding: '6px 12px',
                    borderRadius: 999,
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    flex: 'none',
                  }}
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden>
                    <path d={ICONS[k]} fillRule="evenodd" />
                  </svg>
                  {words[k]}
                </a>
              ))}
            </nav>
          ) : null}
        </header>
      ) : null}

      {/* The credit. */}
      <footer style={{ position: 'absolute', bottom: 'max(8px, env(safe-area-inset-bottom))', insetInline: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          style={{ ...GLASS, pointerEvents: 'auto', fontSize: 11, color: 'rgba(255,255,255,.9)', textDecoration: 'none', padding: '3px 10px', borderRadius: 999 }}
        >
          {words.credit}
        </Link>
      </footer>

      {/* At the counter: the café's menu (owner, 2026-11-22). */}
      {state === 'ready' && spot === 'menu' && links.menu ? (
        <a
          href={links.menu}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="tour-menu"
          style={{
            ...GLASS,
            position: 'absolute',
            left: '50%',
            bottom: 'max(56px, calc(env(safe-area-inset-bottom) + 46px))',
            transform: 'translateX(-50%)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            borderRadius: 999,
            color: '#fff',
            textDecoration: 'none',
            fontSize: 16,
            fontWeight: 600,
            background: 'rgba(20,16,14,.78)',
            zIndex: 3,
          }}
        >
          <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden>
            <path d={ICONS.menu} fillRule="evenodd" />
          </svg>
          {words.seeMenu}
        </a>
      ) : null}

      {state === 'ready' && act ? <Actions act={act} words={words} engine={engine} /> : null}

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

      {upright ? (
        <div
          role="alert"
          data-testid="tour-rotate"
          style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'grid', placeItems: 'center', background: 'rgba(26,22,19,.94)', padding: 32, textAlign: 'center' }}
        >
          <div style={{ display: 'grid', gap: 18, justifyItems: 'center', maxWidth: 280 }}>
            <svg viewBox="0 0 64 64" width={72} height={72} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="22" y="8" width="20" height="36" rx="4" />
              <rect x="14" y="36" width="36" height="20" rx="4" opacity="0.55" />
              <path d="M50 14a14 14 0 0 1 6 12m0 0-4-3m4 3 3-4" />
            </svg>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>{words.rotate}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Action = { key: string; label: string; icon: string; run: (e: TourEngine) => void };

/**
 * The visitor's buttons along the bottom (owner, 2026-11-23): at the counter «Get a coffee» / «Get a cookie» (the
 * barista makes it and hands it over), then «Take a sip» / «Take a bite» (five of each), «Sit down» by a chair, and
 * seated «Put the coffee down» / «Pick up the coffee». They wait while something is under way.
 */
function Actions({ act, words, engine }: { act: TourActivity; words: TourWords; engine: { current: TourEngine | null } }) {
  const list: Action[] = [];
  if (act.order.coffee) list.push({ key: 'getCoffee', label: words.getCoffee, icon: '☕', run: (e) => e.order('coffee') });
  if (act.order.cookie) list.push({ key: 'getCookie', label: words.getCookie, icon: '🍪', run: (e) => e.order('cookie') });
  if (act.coffee?.where === 'hand') list.push({ key: 'sip', label: words.sip, icon: '☕', run: (e) => e.sip() });
  if (act.cookie?.where === 'hand') list.push({ key: 'bite', label: words.bite, icon: '🍪', run: (e) => e.bite() });
  if (act.seat === 'seated' && act.coffee?.where === 'hand') list.push({ key: 'putCoffee', label: words.putCoffee, icon: '⬇', run: (e) => e.putDown('coffee') });
  if (act.seat === 'seated' && act.cookie?.where === 'hand') list.push({ key: 'putCookie', label: words.putCookie, icon: '⬇', run: (e) => e.putDown('cookie') });
  if (act.coffee?.where === 'table' && act.coffee.reach) list.push({ key: 'pickCoffee', label: words.pickCoffee, icon: '⬆', run: (e) => e.pickUp('coffee') });
  if (act.cookie?.where === 'table' && act.cookie.reach) list.push({ key: 'pickCookie', label: words.pickCookie, icon: '⬆', run: (e) => e.pickUp('cookie') });
  // the waiter, for a seated visitor (owner, 2026-11-23): call him, then order from him at the seat
  if (act.waiter === 'call') list.push({ key: 'callWaiter', label: words.callWaiter, icon: '🙋', run: (e) => e.callWaiter() });
  if (act.waiterOrder.coffee) list.push({ key: 'waiterCoffee', label: words.getCoffee, icon: '☕', run: (e) => e.waiterOrder('coffee') });
  if (act.waiterOrder.cookie) list.push({ key: 'waiterCookie', label: words.getCookie, icon: '🍪', run: (e) => e.waiterOrder('cookie') });
  if (act.waiter === 'here') list.push({ key: 'noThanks', label: words.noThanks, icon: '👋', run: (e) => e.dismissWaiter() });
  if (act.seat === 'near') list.push({ key: 'sit', label: words.sit, icon: '🪑', run: (e) => e.sit() });
  if (act.seat === 'seated') list.push({ key: 'stand', label: words.stand, icon: '🚶', run: (e) => e.stand() });
  const making =
    act.making === 'coffee'
      ? words.makingCoffee
      : act.making === 'cookie'
        ? words.makingCookie
        : act.waiter === 'coming'
          ? words.waiterComing
          : act.waiter === 'fetching' || act.waiter === 'bringing'
            ? words.waiterBringing
            : null;
  if (!list.length && !making) return null;
  return (
    <div
      data-testid="tour-actions"
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 'max(40px, calc(env(safe-area-inset-bottom) + 32px))',
        transform: 'translateX(-50%)',
        width: 'min(62vw, 640px)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        zIndex: 3,
        pointerEvents: 'none',
      }}
    >
      {making ? (
        <p role="status" style={{ ...GLASS, margin: 0, padding: '9px 16px', borderRadius: 999, fontSize: 14, fontWeight: 500 }}>
          {making}
        </p>
      ) : null}
      {list.map((a) => {
        const sips = a.key === 'sip' ? act.coffee?.left : a.key === 'bite' ? act.cookie?.left : undefined;
        return (
          <button
            key={a.key}
            type="button"
            data-testid={`tour-${a.key}`}
            disabled={act.busy}
            onClick={() => engine.current && a.run(engine.current)}
            style={{
              ...GLASS,
              background: 'rgba(20,16,14,.78)',
              pointerEvents: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              minHeight: 42,
              padding: '9px 16px',
              border: '1px solid rgba(255,255,255,.18)',
              borderRadius: 999,
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: act.busy ? 'default' : 'pointer',
              opacity: act.busy ? 0.55 : 1,
              whiteSpace: 'nowrap',
              touchAction: 'manipulation',
            }}
          >
            <span aria-hidden>{a.icon}</span>
            {a.label}
            {sips !== undefined ? (
              <span aria-hidden style={{ display: 'inline-flex', gap: 3, marginInlineStart: 2 }}>
                {/* five sips, five bites (props.ts) */}
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: 3, background: i < sips ? '#fff' : 'rgba(255,255,255,.25)' }} />
                ))}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

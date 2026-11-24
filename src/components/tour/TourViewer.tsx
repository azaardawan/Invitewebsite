'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { Joystick, useTouchScreen, webglAvailable } from '@/theme-sdk/gallery3d/Gallery3D';
import type { TourActivity, TourEngine } from './tour-engine';
import type { Menu, MenuItem } from './menu';
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
  sip: string;
  bite: string;
  sit: string;
  stand: string;
  putCoffee: string;
  putCookie: string;
  pickCoffee: string;
  pickCookie: string;
  waiterComing: string;
  waiterBringing: string;
  order: string;
  orderPrice: string;
  making: string;
  paying: string;
  takeIt: string;
  sitToOrder: string;
  handsFull: string;
  currency: string;
  close: string;
  waiterBrings: string;
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
  // the café's menu (owner, 2026-11-24: KOUP's), open over the place
  const [menu, setMenu] = useState<{ menu: Menu; photos: string | null } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
        const debug = new URLSearchParams(window.location.search).get('debug') === '1';
        const e = new TourEngine({ container: el, model, reducedMotion, edits, debug, onProgress: (s) => !cancelled && setProgress(s), onSpot: (k) => !cancelled && setSpot(k), onActivity: (a) => !cancelled && setAct(a) });
        engine.current = e;
        // the debug view: the engine at hand (to put the visitor somewhere: `debugGo`)
        if (debug) (window as unknown as { tourEngine: TourEngine }).tourEngine = e;
        await e.load();
        if (!cancelled) {
          setMenu(e.menu);
          setState('ready');
        }
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

      {state === 'ready' && act ? <Actions act={act} words={words} engine={engine} onMenu={() => setMenuOpen(true)} /> : null}

      {state === 'ready' && act && menu && menuOpen && act.menu ? (
        <MenuSheet
          name={name}
          menu={menu.menu}
          photos={menu.photos}
          variant={act.menu}
          act={act}
          words={words}
          onClose={() => setMenuOpen(false)}
          onOrder={(id) => {
            engine.current?.orderItem(id);
            setMenuOpen(false);
          }}
        />
      ) : null}

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

/** A price in the café's money: "4,500 IQD". */
const money = (n: number, words: TourWords) => `${n.toLocaleString('en-US')} ${words.currency}`;

/**
 * The visitor's buttons along the bottom (owner, 2026-11-23; the menu 2026-11-24): «See the menu» at the counter (the
 * barista makes what is chosen) or at a table (seated, the waiter brings it); then «Take a sip» / «Take a bite» (five
 * of each), «Sit down» by a chair, and seated «Put the drink down» / «Pick up the drink». They wait while something is
 * under way; a line above says how the order is going.
 */
function Actions({ act, words, engine, onMenu }: { act: TourActivity; words: TourWords; engine: { current: TourEngine | null }; onMenu: () => void }) {
  const list: (Action & { open?: boolean })[] = [];
  if (act.menu && !act.order) list.push({ key: 'openMenu', label: words.seeMenu, icon: '📋', run: () => onMenu(), open: true });
  if (act.coffee?.where === 'hand') list.push({ key: 'sip', label: words.sip, icon: '🥤', run: (e) => e.sip() });
  if (act.cookie?.where === 'hand') list.push({ key: 'bite', label: words.bite, icon: '🍪', run: (e) => e.bite() });
  if (act.seat === 'seated' && act.coffee?.where === 'hand') list.push({ key: 'putCoffee', label: words.putCoffee, icon: '⬇', run: (e) => e.putDown('coffee') });
  if (act.seat === 'seated' && act.cookie?.where === 'hand') list.push({ key: 'putCookie', label: words.putCookie, icon: '⬇', run: (e) => e.putDown('cookie') });
  if (act.coffee?.where === 'table' && act.coffee.reach) list.push({ key: 'pickCoffee', label: words.pickCoffee, icon: '⬆', run: (e) => e.pickUp('coffee') });
  if (act.cookie?.where === 'table' && act.cookie.reach) list.push({ key: 'pickCookie', label: words.pickCookie, icon: '⬆', run: (e) => e.pickUp('cookie') });
  if (act.seat === 'near') list.push({ key: 'sit', label: words.sit, icon: '🪑', run: (e) => e.sit() });
  if (act.seat === 'seated') list.push({ key: 'stand', label: words.stand, icon: '🚶', run: (e) => e.stand() });
  const o = act.order;
  const making = !o
    ? null
    : o.stage === 'pay'
      ? words.paying.replace('{price}', money(o.price, words))
      : o.stage === 'ready'
        ? words.takeIt.replace('{item}', o.name)
        : act.waiter === 'coming'
          ? words.waiterComing
          : act.waiter === 'fetching' || act.waiter === 'bringing'
            ? words.waiterBringing
            : words.making.replace('{item}', o.name);
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
        <p role="status" data-testid="tour-order-status" style={{ ...GLASS, margin: 0, padding: '9px 16px', borderRadius: 999, fontSize: 14, fontWeight: 500 }}>
          {making}
        </p>
      ) : null}
      {list.map((a) => {
        const sips = a.key === 'sip' ? act.coffee?.left : a.key === 'bite' ? act.cookie?.left : undefined;
        const off = act.busy && !a.open;
        return (
          <button
            key={a.key}
            type="button"
            data-testid={`tour-${a.key}`}
            disabled={off}
            onClick={() => engine.current && a.run(engine.current)}
            style={{
              ...GLASS,
              background: a.open ? 'rgba(249,249,239,.95)' : 'rgba(20,16,14,.78)',
              pointerEvents: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              minHeight: 42,
              padding: '9px 16px',
              border: '1px solid rgba(255,255,255,.18)',
              borderRadius: 999,
              color: a.open ? '#3a2a22' : '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: off ? 'default' : 'pointer',
              opacity: off ? 0.55 : 1,
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

const CREAM = '#f9f9ef';
const INK = '#3a2a22';
const LINE = '#e4ddd2';

/**
 * The café's menu over the place (owner, 2026-11-24): at the counter as the café's own online menu (its categories,
 * each drink's photo, name and price); at a table as its paper menu (the café's name, a band of diamonds, the items in
 * lines with their prices). Choosing an item and «Order» gives the order: to the barista at the counter, to the waiter
 * when seated (standing by a table, it is only read). An item is greyed out while the hand it goes in is full.
 */
function MenuSheet({
  name,
  menu,
  photos,
  variant,
  act,
  words,
  onClose,
  onOrder,
}: {
  name: string;
  menu: Menu;
  photos: string | null;
  variant: 'counter' | 'table';
  act: TourActivity;
  words: TourWords;
  onClose: () => void;
  onOrder: (id: number) => void;
}) {
  const cats = menu.categories.filter((c) => menu.items.some((i) => i.cat === c.id));
  const [cat, setCat] = useState(cats[0]?.id ?? '');
  const [pick, setPick] = useState<MenuItem | null>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const free = (i: MenuItem) => (i.cup === 'cookie' ? act.free.cookie : act.free.coffee);
  const seatedOrCounter = variant === 'counter' || act.seat === 'seated';
  const paper = variant === 'table';
  const TILE = 88;
  const photo = (i: MenuItem): CSSProperties | null =>
    photos && i.photo >= 0
      ? {
          backgroundImage: `url(${photos})`,
          backgroundSize: `${menu.cols * TILE}px auto`,
          backgroundPosition: `${-(i.photo % menu.cols) * TILE}px ${-Math.floor(i.photo / menu.cols) * TILE}px`,
          backgroundRepeat: 'no-repeat',
        }
      : null;
  const itemButton = (i: MenuItem, n: number) => {
    const ok = free(i);
    const on = pick?.id === i.id;
    const ph = photo(i);
    return (
      <button
        key={i.id}
        type="button"
        data-testid={`tour-menu-item-${i.id}`}
        aria-pressed={on}
        disabled={!ok}
        title={ok ? undefined : words.handsFull}
        onClick={() => setPick(i)}
        style={
          paper
            ? { display: 'flex', alignItems: 'baseline', gap: 8, width: '100%', padding: '7px 4px', background: on ? '#efe7da' : 'transparent', border: 0, borderBottom: `1px solid ${LINE}`, color: INK, font: 'inherit', fontSize: 15, cursor: ok ? 'pointer' : 'default', opacity: ok ? 1 : 0.45, textAlign: 'start' }
            : { display: 'grid', justifyItems: 'center', gap: 4, padding: '8px 6px 10px', background: on ? '#efe7da' : '#fff', border: `2px solid ${on ? '#8a5a3a' : 'transparent'}`, borderRadius: 16, color: INK, font: 'inherit', cursor: ok ? 'pointer' : 'default', opacity: ok ? 1 : 0.45, boxShadow: '0 1px 3px rgba(58,42,34,.12)' }
        }
      >
        {paper ? (
          <>
            <span style={{ fontSize: 11, color: '#8a7a70', minWidth: 18 }}>{String(n + 1).padStart(2, '0')}</span>
            <span style={{ flex: 1, fontWeight: 600 }}>
              {i.name}
              {i.local ? <span style={{ fontWeight: 400, color: '#8a7a70' }}> {i.local}</span> : null}
            </span>
            <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{i.price.toLocaleString('en-US')}</span>
          </>
        ) : (
          <>
            {ph ? <span aria-hidden style={{ ...ph, width: TILE, height: TILE, borderRadius: 12 }} /> : <span aria-hidden style={{ fontSize: 40, lineHeight: `${TILE}px` }}>{i.cup === 'cookie' ? '🍪' : '🥤'}</span>}
            <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, textAlign: 'center' }}>{i.name}</span>
            <span style={{ fontSize: 12.5, color: '#8a6a52', fontVariantNumeric: 'tabular-nums' }}>{money(i.price, words)}</span>
          </>
        )}
      </button>
    );
  };
  const bar = !seatedOrCounter ? words.sitToOrder : pick && !free(pick) ? words.handsFull : null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={words.menu}
      data-testid="tour-menu-sheet"
      data-variant={variant}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'absolute', inset: 0, zIndex: 4, display: 'grid', placeItems: 'center', background: 'rgba(20,16,14,.45)', padding: 'max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))' }}
    >
      <div
        style={{
          width: 'min(760px, 100%)',
          maxHeight: '100%',
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr auto',
          background: paper ? '#fbfaf6' : CREAM,
          color: INK,
          borderRadius: paper ? 6 : 24,
          border: paper ? `2px solid ${INK}` : 0,
          boxShadow: '0 18px 50px rgba(0,0,0,.35)',
          overflow: 'hidden',
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 8px 18px' }}>
          <h2 style={{ margin: 0, flex: 1, fontFamily: paper ? 'Georgia, "Times New Roman", serif' : 'inherit', fontWeight: paper ? 400 : 700, fontSize: paper ? 30 : 20, letterSpacing: paper ? 2 : 0 }}>
            {paper ? name.toUpperCase() : name}
            <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, fontWeight: 500, letterSpacing: 0, marginInlineStart: 10, color: '#8a7a70' }}>{words.menu}</span>
          </h2>
          <button ref={close} type="button" onClick={onClose} aria-label={words.close} data-testid="tour-menu-close" style={{ width: 40, height: 40, borderRadius: 20, border: `1px solid ${LINE}`, background: '#fff', color: INK, fontSize: 18, cursor: 'pointer' }}>
            ✕
          </button>
        </header>
        {paper ? (
          // the band of diamonds of the café's printed menu
          <div aria-hidden style={{ height: 22, margin: '0 16px 6px', background: `${INK} repeating-linear-gradient(90deg, transparent 0 6px, rgba(243,237,228,.9) 6px 7px, transparent 7px 13px)` }} />
        ) : (
          <nav aria-label={words.menu} style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 14px 10px', scrollbarWidth: 'none' }}>
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={cat === c.id}
                onClick={() => setCat(c.id)}
                style={{ flex: 'none', padding: '7px 14px', borderRadius: 999, border: `1px solid ${cat === c.id ? INK : LINE}`, background: cat === c.id ? INK : '#fff', color: cat === c.id ? CREAM : INK, font: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
              >
                {c.label}
              </button>
            ))}
          </nav>
        )}
        <div style={{ overflowY: 'auto', padding: paper ? '4px 18px 12px' : '0 14px 12px', minHeight: 0 }}>
          {paper ? (
            <div style={{ columnWidth: 220, columnGap: 22 }}>
              {cats.map((c) => (
                <section key={c.id} style={{ breakInside: 'avoid', marginBottom: 14 }}>
                  <h3 style={{ margin: '6px 0 4px', textAlign: 'center', fontSize: 14, fontWeight: 600, letterSpacing: 1, borderBottom: `2px solid ${INK}`, paddingBottom: 4 }}>{c.label.toUpperCase()}</h3>
                  {menu.items.filter((i) => i.cat === c.id).map(itemButton)}
                </section>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${TILE + 30}px, 1fr))`, gap: 10 }}>{menu.items.filter((i) => i.cat === cat).map(itemButton)}</div>
          )}
        </div>
        <footer style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderTop: `1px solid ${LINE}`, background: paper ? '#fbfaf6' : CREAM }}>
          <p style={{ margin: 0, flex: 1, fontSize: 13.5, color: '#6b5a50' }}>{bar ?? (variant === 'table' ? words.waiterBrings : pick ? `${pick.name}${pick.local ? ' ' + pick.local : ''}` : '')}</p>
          <button
            type="button"
            data-testid="tour-menu-order"
            disabled={!pick || !!bar || !act.canOrder}
            onClick={() => pick && onOrder(pick.id)}
            style={{ minHeight: 44, padding: '10px 20px', borderRadius: 999, border: 0, background: INK, color: CREAM, font: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: !pick || bar || !act.canOrder ? 0.45 : 1, whiteSpace: 'nowrap' }}
          >
            {pick ? words.orderPrice.replace('{price}', money(pick.price, words)) : words.order}
          </button>
        </footer>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useTransition, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import type { TourEngine } from '@/components/tour/tour-engine';
import { Joystick, useTouchScreen } from '@/theme-sdk/gallery3d/Gallery3D';
import type { ItemEdit, TourEdits } from '@/components/tour/items';
import { saveTourEditsAction } from '@/app/admin/_actions/tours';

type Picked = { code: string; label: string };
const AXES = ['x', 'y', 'z'] as const;
const DEG = 180 / Math.PI;

/**
 * The tour's editor (owner, 2026-11-23): the café's model full screen. Click an item to pick it (its code shows, "#37"),
 * drag its arrows to move it or its ring to turn it, or type the change and nudge it by the buttons; «Show codes» puts
 * every item's code over it. Saved, the tour's visitors see the place as set here.
 */
export function TourEditor({ tourId, name, model, edits: saved }: { tourId: string; name: string; model: string; edits: TourEdits }) {
  const t = useTranslations('admin.tours.editor');
  const tc = useTranslations('admin.catalog');
  const box = useRef<HTMLDivElement>(null);
  const touch = useTouchScreen();
  const engine = useRef<TourEngine | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [progress, setProgress] = useState(0);
  const [edits, setEdits] = useState<TourEdits>(saved);
  const [dirty, setDirty] = useState(false);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [mode, setMode] = useState<'translate' | 'rotate'>('translate');
  const [codes, setCodes] = useState(false);
  const [goTo, setGoTo] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const [items, setItems] = useState<Picked[]>([]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    (async () => {
      try {
        const { TourEngine } = await import('@/components/tour/tour-engine');
        if (cancelled) return;
        const e = new TourEngine({
          container: el,
          model,
          reducedMotion: false,
          onProgress: (s) => !cancelled && setProgress(s),
          edits: saved,
          editor: {
            onSelect: (item) => !cancelled && setPicked(item),
            onChange: (code, edit) => {
              if (cancelled) return;
              setEdits((all) => ({ ...all, [code]: edit }));
              setDirty(true);
            },
          },
        });
        engine.current = e;
        await e.load();
        if (cancelled) return;
        setItems(e.itemList());
        setState('ready');
      } catch (err) {
        if (cancelled) return;
        console.warn('editor unavailable', err);
        setState('failed');
      }
    })();
    return () => {
      cancelled = true;
      engine.current?.dispose();
      engine.current = null;
    };
    // the model loads once; later changes go to the engine directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  // leaving with unsaved changes asks first
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const change = useCallback((code: string, edit: ItemEdit) => {
    setEdits((all) => ({ ...all, [code]: edit }));
    setDirty(true);
    engine.current?.setEdit(code, edit);
  }, []);

  const pick = (code: string) => {
    const c = code.replace(/^#/, '').trim();
    if (!items.some((i) => i.code === c)) {
      setMessage({ ok: false, text: t('noSuchItem', { code: c }) });
      return;
    }
    setMessage(null);
    engine.current?.focus(c);
    void engine.current?.select(c);
  };

  const save = () =>
    startSaving(async () => {
      const r = await saveTourEditsAction(tourId, edits);
      if (r.ok) {
        setDirty(false);
        setMessage({ ok: true, text: t('saved') });
      } else setMessage({ ok: false, text: r.error && tc.has(r.error.replace('catalog.', '') as never) ? tc(r.error.replace('catalog.', '') as never) : t('saveFailed') });
    });

  const cur = picked ? (edits[picked.code] ?? {}) : {};
  const changed = Object.keys(edits).filter((c) => Object.keys(edits[c] ?? {}).length).sort((a, b) => Number(a) - Number(b));
  const panel: CSSProperties = { background: 'rgba(255,255,255,.96)', color: '#1d1a17', borderRadius: 12, boxShadow: '0 4px 18px rgba(0,0,0,.18)' };
  const btn = 'rounded-md border border-line bg-surface px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-40';

  return (
    <div className="fixed inset-0 bg-[#1a1613]" data-testid="tour-editor">
      <div ref={box} className="absolute inset-0" data-state={state} data-testid="tour-editor-canvas" />
      {/* walking on a phone or tablet: the round pad (as on the tour) */}
      {touch && state === 'ready' ? (
        <Joystick style={{ bottom: 'max(24px, env(safe-area-inset-bottom))', zIndex: 2 }} onMove={(x, y) => engine.current?.setStick(x, y)} />
      ) : null}

      {state !== 'ready' ? (
        <div role="status" className="absolute inset-0 grid place-items-center text-sm text-white">
          {state === 'failed' ? t('failed') : `${t('loading')} ${Math.round(progress * 100)}%`}
        </div>
      ) : null}

      {/* the bar along the top */}
      <header className="absolute inset-x-3 top-3 flex flex-wrap items-center gap-2 p-2" style={panel}>
        <Link href={`/admin/tours/${tourId}`} className="text-sm text-accent">
          ← {name}
        </Link>
        <h1 className="text-sm font-semibold">{t('heading')}</h1>
        <label className="ms-auto flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={codes}
            onChange={(e) => {
              setCodes(e.target.checked);
              engine.current?.showCodes(e.target.checked);
            }}
          />
          {t('showCodes')}
        </label>
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            pick(goTo);
          }}
        >
          <input
            value={goTo}
            onChange={(e) => setGoTo(e.target.value)}
            placeholder="#37"
            dir="ltr"
            aria-label={t('goTo')}
            className="w-20 rounded-md border border-line px-2 py-1 text-sm"
          />
          <button type="submit" className={btn}>
            {t('goTo')}
          </button>
        </form>
        <span className="text-xs text-muted">{dirty ? t('unsaved') : t('allSaved')}</span>
        <button type="button" onClick={save} disabled={!dirty || saving} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50" data-testid="tour-editor-save">
          {saving ? t('saving') : t('save')}
        </button>
      </header>

      {message ? (
        <p role={message.ok ? 'status' : 'alert'} className={`absolute start-3 top-20 px-3 py-2 text-sm ${message.ok ? 'text-success' : 'text-danger'}`} style={panel}>
          {message.text}
        </p>
      ) : null}

      {/* the picked item */}
      <aside className="absolute bottom-3 end-3 w-72 space-y-3 p-3 text-sm" style={panel} data-testid="tour-editor-panel">
        {picked ? (
          <>
            <p className="text-base font-semibold" dir="ltr">
              #{picked.code} <span className="text-xs font-normal text-muted">{picked.label.replace(/_/g, ' ')}</span>
            </p>
            <div className="flex gap-1">
              {(['translate', 'rotate'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`rounded-md border px-3 py-1 text-xs ${mode === m ? 'border-accent bg-accent text-white' : 'border-line bg-surface hover:bg-black/5'}`}
                  onClick={() => {
                    setMode(m);
                    engine.current?.setMode(m);
                  }}
                >
                  {t(m === 'translate' ? 'move' : 'turn')}
                </button>
              ))}
            </div>
            {AXES.map((a) => (
              <div key={a} className="flex items-center gap-1" dir="ltr">
                <span className="w-20 text-xs">{t(`axis.${a}`)}</span>
                {[-10, -1].map((d) => (
                  <button key={d} type="button" className={btn} onClick={() => change(picked.code, { ...cur, [a]: Math.round(((cur[a] ?? 0) + d / 100) * 1000) / 1000 })}>
                    {d}
                  </button>
                ))}
                <input
                  type="number"
                  step={1}
                  value={Math.round((cur[a] ?? 0) * 1000) / 10}
                  onChange={(e) => change(picked.code, { ...cur, [a]: Number(e.target.value) / 100 })}
                  className="w-16 rounded border border-line px-1 py-0.5 text-xs"
                  aria-label={`${t(`axis.${a}`)} (cm)`}
                />
                {[1, 10].map((d) => (
                  <button key={d} type="button" className={btn} onClick={() => change(picked.code, { ...cur, [a]: Math.round(((cur[a] ?? 0) + d / 100) * 1000) / 1000 })}>
                    +{d}
                  </button>
                ))}
              </div>
            ))}
            <p className="text-xs text-muted">{t('cm')}</p>
            <div className="flex items-center gap-1" dir="ltr">
              <span className="w-20 text-xs">{t('turnBy')}</span>
              {[-15, -1].map((d) => (
                <button key={d} type="button" className={btn} onClick={() => change(picked.code, { ...cur, ry: ((cur.ry ?? 0) * DEG + d) / DEG })}>
                  {d}°
                </button>
              ))}
              <input
                type="number"
                step={1}
                value={Math.round((cur.ry ?? 0) * DEG * 10) / 10}
                onChange={(e) => change(picked.code, { ...cur, ry: Number(e.target.value) / DEG })}
                className="w-16 rounded border border-line px-1 py-0.5 text-xs"
                aria-label={`${t('turnBy')} (°)`}
              />
              {[1, 15].map((d) => (
                <button key={d} type="button" className={btn} onClick={() => change(picked.code, { ...cur, ry: ((cur.ry ?? 0) * DEG + d) / DEG })}>
                  +{d}°
                </button>
              ))}
            </div>
            <button type="button" className={btn} onClick={() => change(picked.code, {})}>
              {t('resetItem')}
            </button>
          </>
        ) : (
          <p className="text-muted">{t('hint')}</p>
        )}
        {changed.length ? (
          <div className="border-t border-line pt-2">
            <p className="mb-1 text-xs text-muted">{t('changed', { n: changed.length })}</p>
            <div className="flex max-h-24 flex-wrap gap-1 overflow-auto" dir="ltr">
              {changed.map((c) => (
                <button key={c} type="button" className={btn} onClick={() => pick(c)}>
                  #{c}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

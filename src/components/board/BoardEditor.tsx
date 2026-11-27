'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { BoardArrangement, BoardSpot } from '@/catalog/signature-board';
import { BoardCanvas, boardStyles, drawNote } from './BoardCanvas';
import { arrange, inkFor } from './layout';
import { useArrangement } from './useArrangement';
import type { BoardView } from './types';

export type BoardEditorLabels = {
  board: string;
  selectHint: string;
  selected: string;
  turnLeft: string;
  turnRight: string;
  turnHandle: string;
  moveTo: string;
  rearrange: string;
  rearrangeConfirm: string;
  rearrangeYes: string;
  cancel: string;
  saving: string;
  saved: string;
  saveFailed: string;
  empty: string;
};

const fill = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''));

/**
 * The couple's signature board on their receipt (owner, 2026-11-27): every message can be dragged anywhere on its
 * board and turned (the round handle, or the buttons in small steps), and moved to another board. Changes are saved
 * as they go (`saveUrl`, PUT the arrangement); the printed boards are made from exactly this.
 */
export function BoardEditor({ view, saveUrl, labels }: { view: BoardView; saveUrl: string; labels: BoardEditorLabels }) {
  const { fieldRef, arrangement, heights, ready, setState } = useArrangement(view.notes, {
    perBoard: view.perBoard,
    saved: view.arrangement,
    inks: view.design.inks.length,
    rtl: view.dir === 'rtl',
  });
  const [board, setBoard] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  const save = useCallback(
    (next: BoardArrangement, now = false) => {
      if (timer.current) clearTimeout(timer.current);
      const send = async () => {
        setStatus('saving');
        const res = await fetch(saveUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) }).catch(() => null);
        setStatus(res?.ok ? 'saved' : 'failed');
      };
      if (now) void send();
      else timer.current = setTimeout(() => void send(), 700);
    },
    [saveUrl],
  );

  // Once laid out, new messages (and a first arrangement) are saved, so the printed boards match what is shown.
  useEffect(() => {
    if (!ready || !arrangement || !first.current) return;
    first.current = false;
    if (JSON.stringify(arrangement) !== JSON.stringify(view.arrangement)) save(arrangement, true);
  }, [ready, arrangement, view.arrangement, save]);

  const update = useCallback(
    (id: string, change: Partial<BoardSpot>, opts: { reink?: boolean; persist?: boolean } = {}) => {
      setState((st) => {
        if (!st.arrangement) return st;
        const spot = { ...st.arrangement.spots[id]!, ...change };
        if (opts.reink) {
          const others = Object.entries(st.arrangement.spots)
            .filter(([o, s]) => o !== id && s.b === spot.b)
            .map(([o, s]) => ({ box: { x: s.x, y: s.y, w: s.w, h: st.heights[o] ?? 5 }, c: s.c }));
          spot.c = inkFor(id, { x: spot.x, y: spot.y, w: spot.w, h: st.heights[id] ?? 5 }, others, view.design.inks.length, spot.c);
        }
        const next = { ...st.arrangement, spots: { ...st.arrangement.spots, [id]: spot } };
        if (opts.persist !== false) save(next);
        return { ...st, arrangement: next };
      });
    },
    [setState, save, view.design.inks.length],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>, id: string) => {
    const field = e.currentTarget.parentElement;
    if (!field || !arrangement) return;
    setSelected(id);
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const rect = field.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY, spot: arrangement.spots[id]! };
    const h = heights[id] ?? 5;
    let moved = false;
    const move = (ev: PointerEvent) => {
      const dx = ((ev.clientX - start.x) / rect.width) * 100;
      const dy = ((ev.clientY - start.y) / rect.height) * 100;
      if (!moved && Math.hypot(dx, dy) < 0.5) return;
      moved = true;
      // Anywhere on the board, but never wholly off it.
      update(id, { x: clamp(start.spot.x + dx, -start.spot.w / 2, 100 - start.spot.w / 2), y: clamp(start.spot.y + dy, -h / 2, 100 - h / 2) }, { persist: false });
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      // Put down next to a message in the same ink: it takes another one.
      if (moved) update(id, {}, { reink: true });
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  const onTurn = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!selected || !arrangement) return;
    const note = e.currentTarget.parentElement?.querySelector<HTMLElement>(`[data-note="${selected}"]`);
    if (!note) return;
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const b = note.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    const a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
    const r0 = arrangement.spots[selected]!.r;
    const id = selected;
    const move = (ev: PointerEvent) => {
      let r = r0 + ((Math.atan2(ev.clientY - cy, ev.clientX - cx) - a0) * 180) / Math.PI;
      r = ((((r + 180) % 360) + 360) % 360) - 180;
      update(id, { r: Math.round(r * 10) / 10 }, { persist: false });
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
      update(id, {});
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  };

  const boards = arrangement?.scales.length ?? 1;
  const spot = selected && arrangement ? arrangement.spots[selected] : null;
  const note = selected ? view.notes.find((n) => n.id === selected) : null;

  const moveTo = (b: number) => {
    if (!selected || !arrangement) return;
    // It lands in the middle of the other board, in an ink none of its new neighbours has.
    update(selected, { b, x: 50 - (spot?.w ?? 20) / 2, y: 45 }, { reink: true });
    setBoard(b);
  };

  const rearrange = () => {
    const field = fieldRef.current;
    if (!field) return;
    setConfirming(false);
    setSelected(null);
    setBoard(0);
    const out = arrange(field, view.notes, { perBoard: view.perBoard, saved: null, inks: view.design.inks.length, rtl: view.dir === 'rtl', drawNote });
    setState({ ...out, ready: true });
    save(out.arrangement, true);
  };

  const button = 'rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-heading disabled:opacity-40';
  return (
    <div className="flex flex-col gap-3" data-board-editor="">
      {!view.notes.length ? <p className="text-sm text-muted">{labels.empty}</p> : null}
      {boards > 1 ? (
        <div role="tablist" className="flex flex-wrap gap-2">
          {Array.from({ length: boards }, (_, b) => (
            <button
              key={b}
              type="button"
              role="tab"
              aria-selected={board === b}
              onClick={() => {
                setBoard(b);
                setSelected(null);
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${board === b ? 'border-heading bg-heading text-surface' : 'border-line bg-surface text-heading'}`}
            >
              {fill(labels.board, { n: b + 1 })}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        <div className="relative min-w-0 overflow-hidden rounded-lg border border-line" dir="ltr">
          {/* Every board stays in the page (the first measures the notes); only the chosen one shows. */}
          {Array.from({ length: boards }, (_, b) => (
            <div key={b} hidden={b !== board}>
              <BoardCanvas
                design={view.design}
                heading={view.heading}
                dir={view.dir}
                lang={view.lang}
                notes={view.notes}
                arrangement={arrangement}
                board={b}
                fieldRef={b === 0 ? fieldRef : undefined}
                edit={{ selected, onPointerDown, onBackground: () => setSelected(null) }}
              >
                {spot && spot.b === b ? (
                  <button
                    type="button"
                    className={boardStyles.handle}
                    aria-label={labels.turnHandle}
                    title={labels.turnHandle}
                    onPointerDown={onTurn}
                    style={{ left: `calc(${spot.x + spot.w}% - 3cqi)`, top: `calc(${spot.y}% - 3cqi)` }}
                  >
                    ⟳
                  </button>
                ) : null}
              </BoardCanvas>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:sticky sm:bottom-2">
          <p className="font-medium text-heading">{note ? fill(labels.selected, { name: note.name }) : labels.selectHint}</p>
          <div className="flex gap-2">
            <button type="button" className={`${button} flex-1`} disabled={!spot} onClick={() => selected && spot && update(selected, { r: Math.max(-180, spot.r - 5) })}>
              {labels.turnLeft}
            </button>
            <button type="button" className={`${button} flex-1`} disabled={!spot} onClick={() => selected && spot && update(selected, { r: Math.min(180, spot.r + 5) })}>
              {labels.turnRight}
            </button>
          </div>
          {boards > 1
            ? Array.from({ length: boards }, (_, b) =>
                b === board ? null : (
                  <button key={b} type="button" className={button} disabled={!spot} onClick={() => moveTo(b)} data-move-to={b + 1}>
                    {fill(labels.moveTo, { n: b + 1 })}
                  </button>
                ),
              )
            : null}
          {confirming ? (
            <div className="flex flex-col gap-2 rounded-md bg-paper p-3 text-sm">
              <p>{labels.rearrangeConfirm}</p>
              <div className="flex gap-2">
                <button type="button" className={`${button} flex-1`} onClick={rearrange}>
                  {labels.rearrangeYes}
                </button>
                <button type="button" className={`${button} flex-1`} onClick={() => setConfirming(false)}>
                  {labels.cancel}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={button} onClick={() => setConfirming(true)} disabled={!view.notes.length}>
              {labels.rearrange}
            </button>
          )}
          <p className="text-xs text-muted" role="status">
            {status === 'saving' ? labels.saving : status === 'saved' ? labels.saved : status === 'failed' ? labels.saveFailed : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

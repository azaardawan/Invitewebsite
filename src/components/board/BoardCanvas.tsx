'use client';

import '@fontsource/aref-ruqaa/400.css';
import '@fontsource/aref-ruqaa/700.css';
import '@fontsource-variable/noto-sans-arabic';
import '@fontsource-variable/vazirmatn';
import type React from 'react';
import type { BoardArrangement } from '@/catalog/signature-board';
import type { BoardDesignView, BoardFont, BoardNote } from './types';
import s from './board.module.css';

export const BOARD_FONTS: Record<BoardFont, string> = {
  ruqaa: "'Aref Ruqaa', serif",
  sans: "'Noto Sans Arabic Variable', 'Noto Sans Arabic', sans-serif",
  vazir: "'Vazirmatn Variable', 'Vazirmatn', sans-serif",
};

/** Latin-only text (an English message) reads left to right, whatever the invitation's language. */
export function noteDir(text: string): 'rtl' | 'ltr' {
  return /[֐-ࣿיִ-ﻼ]/.test(text) ? 'rtl' : 'ltr';
}

const SIG_PATH = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' } as const;

/** One message as React draws it (keep in step with `drawNote`, which the layout measures). */
function NoteBody({ note }: { note: BoardNote }) {
  return (
    <>
      <p className={s.message} dir={noteDir(note.message)}>
        {note.message}
      </p>
      <div className={s.foot}>
        <span className={s.name} dir={noteDir(note.name)}>
          {note.name}
        </span>
        {note.signature ? (
          <svg className={s.sig} viewBox={note.signature.viewBox} aria-hidden="true">
            <path d={note.signature.d} strokeWidth={note.signature.lineWidth} {...SIG_PATH} />
          </svg>
        ) : null}
      </div>
    </>
  );
}

/** The same note as plain DOM, for measuring before React draws it. */
export function drawNote(note: BoardNote): HTMLElement {
  const el = document.createElement('div');
  el.className = s.note!;
  const p = document.createElement('p');
  p.className = s.message!;
  p.dir = noteDir(note.message);
  p.textContent = note.message;
  const foot = document.createElement('div');
  foot.className = s.foot!;
  const name = document.createElement('span');
  name.className = s.name!;
  name.dir = noteDir(note.name);
  name.textContent = note.name;
  foot.appendChild(name);
  if (note.signature) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', s.sig!);
    svg.setAttribute('viewBox', note.signature.viewBox);
    foot.appendChild(svg);
  }
  el.append(p, foot);
  return el;
}

/**
 * One board: the owner's artwork, the heading (names) and the messages placed on it as arranged. Static on the print
 * page and in Admin; the editor passes `edit` to pick notes up, move and turn them.
 */
export function BoardCanvas({
  design,
  heading,
  dir,
  lang,
  notes,
  arrangement,
  board,
  fieldRef,
  edit,
  children,
}: {
  design: BoardDesignView;
  heading: { names: string; subtitle: string } | null;
  dir: 'rtl' | 'ltr';
  lang: string;
  /** All notes; only those on `board` are drawn. */
  notes: BoardNote[];
  arrangement: BoardArrangement | null;
  board: number;
  fieldRef?: React.Ref<HTMLDivElement>;
  edit?: { selected: string | null; onPointerDown: (e: React.PointerEvent<HTMLDivElement>, id: string) => void; onBackground: () => void };
  /** Drawn in the message area over the notes (the editor's turn handle). */
  children?: React.ReactNode;
}) {
  const a = design.area;
  const scale = arrangement?.scales[board] ?? 1;
  const shown = notes.filter((n) => arrangement?.spots[n.id]?.b === board);
  return (
    <div
      className={`${s.board} ${edit ? s.editable : ''}`}
      dir={dir}
      lang={lang}
      data-board={board}
      style={{ aspectRatio: `${design.widthMm} / ${design.heightMm}`, backgroundImage: design.src ? `url("${design.src}")` : undefined, fontFamily: BOARD_FONTS[design.font] }}
      onPointerDown={edit ? (e) => e.target === e.currentTarget && edit.onBackground() : undefined}
    >
      {heading ? (
        <div className={s.head} style={{ insetInline: `${Math.min(a.left, a.right)}%`, height: `${Math.max(4, a.top - 3)}%`, color: design.titleColor, fontFamily: BOARD_FONTS[design.titleFont] }}>
          {heading.names ? <p className={s.names}>{heading.names}</p> : null}
          <p className={s.subtitle}>{heading.subtitle}</p>
        </div>
      ) : null}
      <div
        ref={fieldRef}
        className={s.field}
        style={{ top: `${a.top}%`, right: `${a.right}%`, bottom: `${a.bottom}%`, left: `${a.left}%`, ['--s' as string]: scale }}
        onPointerDown={edit ? (e) => e.target === e.currentTarget && edit.onBackground() : undefined}
      >
        {shown.map((n) => {
          const spot = arrangement!.spots[n.id]!;
          return (
            <div
              key={n.id}
              className={`${s.note} ${edit?.selected === n.id ? s.selected : ''}`}
              data-note={n.id}
              style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, transform: spot.r ? `rotate(${spot.r}deg)` : undefined, ['--c' as string]: design.inks[spot.c] ?? design.inks[0] }}
              onPointerDown={edit ? (e) => edit.onPointerDown(e, n.id) : undefined}
            >
              <NoteBody note={n} />
            </div>
          );
        })}
        {children}
      </div>
    </div>
  );
}

export { s as boardStyles };

import type { CSSProperties, ReactNode } from "react";
import p from "./poster.module.css";

/** One line, or a block of lines, of a poster's text (frames.ts). */
export type Slot = {
  x: number;
  y: number;
  w: number;
  size: number;
  color: string;
  font: "serif" | "script";
  track?: number;
  upper?: boolean;
  lines?: number;
  gap?: number;
};
export type Box = readonly [
  left: number,
  top: number,
  width: number,
  height: number,
];
export type Frame = {
  art: string;
  widthMm: number;
  heightMm: number;
  outline: string;
  slots: Readonly<Record<string, Slot>>;
  boxes?: Readonly<Record<string, Box>>;
};

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

/** Rough width of a line in ems, by font: enough to shrink a long name or line to its place on the poster. */
function ems(text: string, slot: Slot, arabic: boolean) {
  const n = Array.from(text).length;
  if (arabic) return n * (slot.font === "script" ? 0.5 : 0.48);
  if (slot.font === "script") return n * 0.56;
  return n * ((slot.upper ? 0.68 : 0.47) + (slot.track ?? 0) / slot.size);
}

/** A box from frames.ts as absolute position (% of the card). */
export function boxStyle([left, top, width, height]: Box): CSSProperties {
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
}

/**
 * One slot's text where the poster had its own: centred on `x`, first baseline on `y`. A single line shrinks to fit
 * its width. A block wraps within its width around the middle of the poster's lines; longer text than the poster's
 * gets smaller so it keeps to about the same height and never reaches the lines around it.
 */
export function SlotText({
  frame,
  role,
  text,
  className,
}: {
  frame: Frame;
  role: string;
  text: string | null | undefined;
  className?: string;
}) {
  const slot = frame.slots[role];
  if (!slot || !text) return null;
  const arabic = ARABIC.test(text);
  const widthMm = (slot.w / 100) * frame.widthMm;
  const lines = slot.lines ?? 1;
  const base = slot.size * (arabic ? (slot.font === "script" ? 0.8 : 0.86) : 1);
  const est = ems(text, slot, arabic) * base;
  const gapMm = ((slot.gap ?? 0) / 100) * frame.heightMm;
  let size = base;
  let top: number;
  if (lines === 1) {
    size *= Math.max(0.42, Math.min(1, widthMm / est));
    top = (slot.y / 100) * frame.heightMm - (size * 1.3) / 2 - size * 0.32;
  } else {
    // as many lines as the text needs at a size, kept within ~1.2 × the poster's block (lines shrink with the size)
    const room = lines * gapMm * 1.2;
    const height = (k: number) =>
      Math.ceil((est * k) / (widthMm * 0.92)) * gapMm * k;
    let k = 1;
    while (k > 0.5 && height(k) > room) k -= 0.03;
    size *= k;
    const middle =
      (slot.y / 100) * frame.heightMm + ((lines - 1) * gapMm) / 2 - base * 0.32;
    top = middle - height(k) / 2;
  }
  const lineMm = lines > 1 ? gapMm * (size / base) : size * 1.3;
  const style: CSSProperties = {
    left: `${slot.x - slot.w / 2}%`,
    width: `${slot.w}%`,
    top: `${top}mm`,
    color: slot.color,
    fontSize: `${size}mm`,
    lineHeight: `${lineMm}mm`,
    letterSpacing: !arabic && slot.track ? `${slot.track}mm` : undefined,
    textTransform: !arabic && slot.upper ? "uppercase" : undefined,
  };
  return (
    <p
      className={`${p.slot} ${p[slot.font]} ${lines > 1 ? p.block : p.line} ${className ?? ""}`}
      data-arabic={arabic ? "" : undefined}
      style={style}
    >
      {text}
    </p>
  );
}

/** The poster's front: its artwork (lettering removed) and the customer's text in its places. */
export function PosterFront({
  frame,
  art,
  lines,
  children,
}: {
  frame: Frame;
  art: string;
  lines: Readonly<Record<string, string | null | undefined>>;
  children?: ReactNode;
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.art} src={art} alt="" />
      {Object.keys(frame.slots).map((role) => (
        <SlotText key={role} frame={frame} role={role} text={lines[role]} />
      ))}
      {children}
    </>
  );
}

/** The team's extra line, under the lowest line of the poster's text, in that line's style. */
export function ExtraLine({
  frame,
  text,
}: {
  frame: Frame;
  text: string | null;
}) {
  if (!text) return null;
  const last = Object.values(frame.slots).reduce((a, b) => (b.y > a.y ? b : a));
  const below =
    last.y +
    ((last.lines ?? 1) - 1) * (last.gap ?? 0) +
    (last.size * 1.9 * 100) / frame.heightMm;
  const slot: Slot = {
    ...last,
    y: below,
    size: last.size * 0.85,
    lines: 1,
    upper: false,
    track: 0,
  };
  return (
    <SlotText
      frame={{ ...frame, slots: { extra: slot } }}
      role="extra"
      text={text}
    />
  );
}

/**
 * The back: the frame alone, and the customer's title and message, the names and the QR code in the middle of it.
 * `ink`: the text colour on the frame's ground.
 */
export function PosterBack({
  art,
  ink,
  title,
  message,
  names,
  qrDataUrl,
  scanToOpen,
}: {
  art: string;
  ink: string;
  title: string;
  message: string | null;
  names: string;
  qrDataUrl: string | null;
  scanToOpen: string;
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.art} src={art} alt="" />
      <div className={p.back} style={{ color: ink }}>
        <h1 className={p.title}>{title}</h1>
        {message ? (
          <p
            className={p.message}
            data-long={message.length > 180 ? "" : undefined}
          >
            {message}
          </p>
        ) : null}
        {names ? <p className={p.backNames}>{names}</p> : null}
        {qrDataUrl ? (
          <figure className={p.qr}>
            {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
            <img src={qrDataUrl} alt="" />
            <figcaption>{scanToOpen}</figcaption>
          </figure>
        ) : null}
      </div>
    </>
  );
}

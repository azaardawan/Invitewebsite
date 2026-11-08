import { ThemeBorder, type KeepsakeProps } from "@/theme-sdk";
import { KILIM_BORDER } from "../border";
import { copyFor } from "../copy";
import fonts from "../fonts.module.css";
import page from "../assets/keepsake-page.webp";
import divider from "../assets/keepsake-divider.webp";
import p from "./print.module.css";

/**
 * Keepsake of guest messages, A4 (owner's artwork, 2026-11-08): «Guest Wishes» under the kilim arch, then guest slots
 * of a «Guest Name:» line and the message (no ruled lines: owner, 2026-11-08), with the diamond divider between them and the pomegranate at the foot. Every
 * page is the artwork; each message is written in its slot (a long one gets more room). The last page is
 * filled with empty slots, as in the artwork, so it can also be written in by hand; with no messages yet the keepsake
 * is one page of empty slots. An owner's replacement border is drawn over it; the design's own frame is in the artwork.
 */

/** Slot geometry in mm, measured on the artwork (210 mm wide). Keep in step with print.module.css. */
const LINE = 7.22;
const HEAD = 6.41; // the name row and the gap under it
const BETWEEN = 13.33; // from a slot's last line to the next slot, the divider in the middle
const ROOM = 198.7; // from the first slot (63.3 mm) to above the pomegranate (262 mm)
const MIN_LINES = 3;
/** Fewer characters per line than really fit, so an estimate never runs past the page. */
const CHARS_PER_LINE = 70;
const MAX_ROWS = 12;

type Slot = { name: string; text: string; lines: number } | null;

function tidy(message: string): string[] {
  const rows = message
    .replace(/\r/g, "")
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);
  // A message of many short rows is joined so it can't need more lines than a page has.
  return rows.length > MAX_ROWS ? [rows.join(" ")] : rows;
}

function linesFor(rows: string[]): number {
  const n = rows.reduce(
    (sum, r) => sum + Math.max(1, Math.ceil(r.length / CHARS_PER_LINE)),
    0,
  );
  return Math.max(MIN_LINES, n);
}

const height = (lines: number) => HEAD + lines * LINE;

/** Pages of slots: messages in order, then empty slots while they fit on the last page. */
function paginate(messages: KeepsakeProps["messages"]): Slot[][] {
  const pages: Slot[][] = [];
  let current: Slot[] = [];
  let used = 0;
  const place = (slot: Slot, lines: number): boolean => {
    const need = (current.length ? BETWEEN : 0) + height(lines);
    if (current.length && used + need > ROOM) return false;
    current.push(slot);
    used += need;
    return true;
  };
  for (const m of messages) {
    const rows = tidy(m.message);
    const lines = linesFor(rows);
    const slot = { name: m.guestName, text: rows.join("\n"), lines };
    if (!place(slot, lines)) {
      pages.push(current);
      current = [];
      used = 0;
      place(slot, lines);
    }
  }
  while (place(null, MIN_LINES));
  pages.push(current);
  return pages;
}

export default function Keepsake({
  locale,
  dir,
  lang,
  messages,
  border,
}: KeepsakeProps) {
  const t = copyFor(locale);
  const pages = paginate(messages);
  return (
    <div
      className={`${fonts.fonts} ${p.keepsake}`}
      dir={dir}
      lang={lang}
      data-script={locale === "en" ? "latin" : "arabic"}
    >
      {border ? (
        <ThemeBorder border={border} fallback={KILIM_BORDER} medium="print" />
      ) : null}
      {pages.map((slots, i) => (
        <section key={i} className={p.page}>
          {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
          <img className={p.pageArt} src={page.src} alt="" />
          <h1 className={p.title}>{t.keepsakeTitle}</h1>
          <div className={p.slots}>
            {slots.map((slot, j) => (
              <article key={j} className={p.slot}>
                {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
                {j > 0 ? (
                  <img className={p.divider} src={divider.src} alt="" />
                ) : null}
                <div className={p.nameRow}>
                  <span className={p.nameLabel}>{t.guestName}</span>
                  <span className={p.name} dir="auto">
                    {slot?.name ?? ""}
                  </span>
                </div>
                <p
                  className={p.lines}
                  dir="auto"
                  style={{
                    minHeight: `${(slot?.lines ?? MIN_LINES) * LINE}mm`,
                  }}
                >
                  {slot?.text ?? ""}
                </p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

import '@fontsource/aref-ruqaa/400.css';
import '@fontsource/aref-ruqaa/700.css';
import '@fontsource-variable/noto-sans-arabic';
import '@fontsource-variable/vazirmatn';
import type React from 'react';
import { FONTS, JUSTIFY, type ArtworkSide, type PrintLook } from './ArtworkCard';
import { TINT, mix } from './look';
export { tintedLook } from './look';

/**
 * Newborn extras, drawn by the platform: the Instagram story, the chocolate sticker (round or square) and
 * the label that wraps around a water bottle, each alone or as a print-ready A4 sheet. They share one look
 * per design (colours and fonts, from the design and the customer's colour set unless the owner sets
 * them, optionally tinted for a boy or a girl), so they read as one set with the card; each has its own
 * layouts. The owner can give any of them its own artwork, layout, details and colours in Admin.
 * Until the invitation is paid every one of them carries a watermark (drawn here, on the server's render).
 */
export type ProductData = {
  dir: 'rtl' | 'ltr';
  lang: string;
  babyName: string | null;
  gender: 'boy' | 'girl' | null;
  parents: string | null;
  birthDate: string | null;
  quote: string | null;
  labels: { itsABoy: string; itsAGirl: string; bornOn: string; watermark: string; watermarkNote: string };
  /** The shared look of this design's extras. */
  look: PrintLook;
  /** The owner's settings per extra (null = defaults on the shared look). */
  design: { story: ArtworkSide | null; sticker: ArtworkSide | null; bottle: ArtworkSide | null };
  stickerShape: 'round' | 'square';
  watermark: boolean;
};

/** Sizes in mm (story in CSS px). A 4 cm sticker suits chocolates; the label wraps a 0.5 L bottle (≈ 21 cm round). */
export const PRODUCT_SIZES = {
  story: { width: 1080, height: 1920 },
  sticker: { mm: 40, gapMm: 4 },
  bottle: { width: 215, height: 55, gapMm: 6 },
} as const;

type Style = {
  src: string;
  paper: string;
  ink: string;
  accent: string;
  heading: string;
  body: string;
  align: 'top' | 'center' | 'bottom';
  inset: number;
  scale: number;
  layout: string;
  show: { gender: boolean; date: boolean; parents: boolean; quote: boolean };
};

/** One extra's final style: its own colours, or the shared look (tinted for the baby when asked). */
function styleOf(design: ArtworkSide | null, d: ProductData, defaults: { inset: number; layout: string }): Style {
  const look = d.look;
  const own = design?.ownLook;
  const tint = !own && look.babyColours && d.gender ? TINT[d.gender] : null;
  return {
    src: design?.src ?? '',
    paper: own ? (design!.paper ?? look.paper) : tint ? mix(look.paper, tint.paper, 0.75) : look.paper,
    ink: own ? design!.ink : look.ink,
    accent: own ? design!.accent : tint ? mix(look.accent, tint.accent, 0.7) : look.accent,
    heading: FONTS[own ? design!.headingFont : look.headingFont],
    body: FONTS[own ? design!.bodyFont : look.bodyFont],
    align: design?.align ?? 'center',
    inset: design?.insetMm ?? defaults.inset,
    scale: (design?.scale ?? 100) / 100,
    layout: design?.layout ?? defaults.layout,
    show: { gender: true, date: true, parents: true, quote: true, ...(design?.show ?? {}) },
  };
}

/** Repeated diagonal "preview" marks and a ribbon saying they go away after purchase. */
export function Watermark({ labels, compact = false }: { labels: Pick<ProductData['labels'], 'watermark' | 'watermarkNote'>; compact?: boolean }) {
  const text = labels.watermark.replace(/[<&>]/g, '');
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160"><text x="130" y="85" text-anchor="middle" font-family="Noto Sans Arabic, sans-serif" font-size="26" font-weight="700" fill="rgba(80,40,50,0.22)" transform="rotate(-28 130 80)">${text}</text></svg>`;
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tile)}")`, backgroundSize: compact ? '34% auto' : '260px auto' }} />
      <div
        style={{
          position: 'absolute',
          insetInline: 0,
          // Low on the picture, so the name stays readable in the preview.
          bottom: compact ? '9%' : '7%',
          background: 'rgba(43,26,30,0.72)',
          color: '#fff',
          textAlign: 'center',
          fontFamily: FONTS.sans,
          fontWeight: 700,
          fontSize: compact ? '7%' : undefined,
          padding: compact ? '1.5% 3%' : '0.6em 1em',
          lineHeight: 1.4,
        }}
      >
        {labels.watermarkNote}
      </div>
    </div>
  );
}

function Paper({ s }: { s: Style }) {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: s.paper }} />
      {/* eslint-disable-next-line @next/next/no-img-element -- print document */}
      {s.src ? <img src={s.src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
    </>
  );
}

const genderLine = (d: ProductData) => (d.gender === 'boy' ? d.labels.itsABoy : d.gender === 'girl' ? d.labels.itsAGirl : null);

// ---------------- Story (1080 × 1920) ----------------

/** The Instagram story: "It's a boy/girl", the name, the date, the parents and the quote, in one of three layouts. */
export function StoryPage({ d }: { d: ProductData }) {
  const s = styleOf(d.design.story, d, { inset: 0, layout: 'classic' });
  const k = s.scale;
  const gender = s.show.gender ? genderLine(d) : null;
  const name = d.babyName ? <h1 style={{ margin: 0, fontFamily: s.heading, fontWeight: 700, fontSize: 190 * k, lineHeight: 1.35, color: s.accent, overflowWrap: 'anywhere' }}>{d.babyName}</h1> : null;
  const date =
    s.show.date && d.birthDate ? (
      <p style={{ margin: 0, fontSize: 46 * k }}>
        <span style={{ display: 'block', fontSize: '0.7em', opacity: 0.8 }}>{d.labels.bornOn}</span>
        {d.birthDate}
      </p>
    ) : null;
  const parents = s.show.parents && d.parents ? <p style={{ margin: 0, fontFamily: s.heading, fontSize: 64 * k, color: s.accent }}>{d.parents}</p> : null;
  const quote = s.show.quote && d.quote ? <p style={{ margin: 0, maxWidth: 820, fontSize: 48 * k, lineHeight: 1.6, fontStyle: 'italic' }}>{d.quote}</p> : null;
  const kicker = gender ? <p style={{ margin: 0, fontSize: 52 * k, color: s.accent, fontWeight: 600 }}>{gender}</p> : null;
  const column: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 36 * k };
  const pad = s.src ? `${s.inset * 4}px` : '170px 120px';
  return (
    <div dir={d.dir} lang={d.lang} data-layout={s.layout} style={{ position: 'relative', width: PRODUCT_SIZES.story.width, height: PRODUCT_SIZES.story.height, overflow: 'hidden', color: s.ink, fontFamily: s.body }}>
      <Paper s={s} />
      {s.layout === 'top' ? (
        <>
          {!s.src ? <div style={{ position: 'absolute', width: 1300, height: 1300, borderRadius: '50%', background: s.accent, opacity: 0.1, top: -560, left: -110 }} /> : null}
          <div style={{ position: 'absolute', inset: 0, padding: pad, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ ...column, paddingTop: 60 }}>
              {kicker}
              {name}
            </div>
            <div style={column}>
              {date}
              {parents}
              {quote}
            </div>
          </div>
        </>
      ) : s.layout === 'framed' ? (
        <div style={{ position: 'absolute', inset: 0, padding: s.src ? pad : '150px 90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...column, width: '100%', padding: '110px 70px', borderRadius: 60, background: 'rgba(255,255,255,0.78)', border: `4px solid ${s.accent}`, boxShadow: '0 30px 80px rgba(0,0,0,0.08)' }}>
            {kicker}
            {name}
            <div style={{ width: 160, height: 4, background: s.accent, opacity: 0.5, borderRadius: 2 }} />
            {date}
            {parents}
            {quote}
          </div>
        </div>
      ) : (
        <>
          {!s.src ? <SoftDecor accent={s.accent} /> : null}
          <div style={{ ...column, position: 'absolute', inset: 0, padding: pad, justifyContent: JUSTIFY[s.align] }}>
            {kicker}
            {name}
            {date}
            {parents}
            {quote}
          </div>
        </>
      )}
      {d.watermark ? <Watermark labels={d.labels} /> : null}
    </div>
  );
}

// ---------------- Sticker (40 mm, round or square) ----------------

/** One chocolate sticker in one of three layouts: name and date, the name alone, or a badge. */
export function Sticker({ d, cutLine = false }: { d: ProductData; cutLine?: boolean }) {
  const s = styleOf(d.design.sticker, d, { inset: 4, layout: 'classic' });
  const size = PRODUCT_SIZES.sticker.mm;
  const round = d.stickerShape === 'round';
  const radius = round ? '50%' : '3mm';
  const name = (mm: number) => (d.babyName ? <p style={{ margin: 0, fontFamily: s.heading, fontWeight: 700, fontSize: `${mm * s.scale}mm`, lineHeight: 1.4, paddingBottom: '1mm', color: s.accent, overflowWrap: 'anywhere' }}>{d.babyName}</p> : null);
  const date = s.show.date && d.birthDate ? <p style={{ margin: 0, maxWidth: '26mm', fontSize: `${2.1 * s.scale}mm`, lineHeight: 1.35 }}>{d.birthDate}</p> : null;
  const gender = s.show.gender ? genderLine(d) : null;
  const ring = (inset: number, width: number, opacity = 0.6) => (!s.src ? <div style={{ position: 'absolute', inset: `${inset}mm`, borderRadius: round ? '50%' : '2mm', border: `${width}mm solid ${s.accent}`, opacity }} /> : null);
  const body: React.CSSProperties = { position: 'absolute', inset: `${round ? 6 : s.inset}mm`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1.2mm' };
  return (
    <div
      dir={d.dir}
      lang={d.lang}
      data-layout={s.layout}
      style={{ position: 'relative', width: `${size}mm`, height: `${size}mm`, borderRadius: radius, overflow: 'hidden', color: s.ink, fontFamily: s.body, outline: cutLine ? '0.2mm solid #c9c2bd' : undefined, outlineOffset: '-0.1mm' }}
    >
      <Paper s={s} />
      {s.layout === 'name' ? (
        <>
          {ring(1.4, 0.3)}
          {ring(2.6, 0.15, 0.45)}
          <div style={body}>{name(9)}</div>
        </>
      ) : s.layout === 'badge' ? (
        <>
          {!s.src ? <div style={{ position: 'absolute', insetInline: 0, top: '38%', height: '30%', background: s.accent, opacity: 0.12 }} /> : null}
          {ring(1.6, 0.3)}
          <div style={{ ...body, gap: '1.2mm' }}>
            {gender ? <p style={{ margin: 0, fontSize: `${2.2 * s.scale}mm`, fontWeight: 600, color: s.accent }}>{gender}</p> : null}
            {name(7)}
            {date}
          </div>
        </>
      ) : (
        <>
          {ring(1.6, 0.35)}
          <div style={body}>
            {name(7.2)}
            {date}
          </div>
        </>
      )}
      {d.watermark ? <Watermark labels={d.labels} compact /> : null}
    </div>
  );
}

/** An A4 sheet of stickers (4 × 6 = 24) with light cut lines, at their real size. */
export function StickerSheet({ d }: { d: ProductData }) {
  const { mm, gapMm } = PRODUCT_SIZES.sticker;
  const cols = 4;
  const rows = 6;
  return (
    <div style={{ width: '210mm', height: '297mm', position: 'relative', display: 'grid', placeContent: 'center', gridTemplateColumns: `repeat(${cols}, ${mm}mm)`, gridAutoRows: `${mm}mm`, gap: `${gapMm}mm` }}>
      {Array.from({ length: cols * rows }, (_, i) => (
        <Sticker key={i} d={{ ...d, watermark: false }} cutLine />
      ))}
      {d.watermark ? <Watermark labels={d.labels} /> : null}
    </div>
  );
}

// ---------------- Bottle label (215 × 55 mm) ----------------

/** One water bottle label (wraps a 0.5 L bottle with a small overlap) in one of three layouts. */
export function BottleLabel({ d, cutLine = false }: { d: ProductData; cutLine?: boolean }) {
  const s = styleOf(d.design.bottle, d, { inset: 6, layout: 'classic' });
  const { width, height } = PRODUCT_SIZES.bottle;
  const name = (mm: number, color = s.accent) => (d.babyName ? <p style={{ margin: 0, fontFamily: s.heading, fontWeight: 700, fontSize: `${mm * s.scale}mm`, lineHeight: 1.4, paddingBottom: '1.4mm', color, overflowWrap: 'anywhere' }}>{d.babyName}</p> : null);
  const quote = s.show.quote && d.quote ? <p style={{ margin: 0, fontSize: `${3.2 * s.scale}mm`, lineHeight: 1.4 }}>{d.quote}</p> : null;
  const details = [s.show.date ? d.birthDate : null, s.show.parents ? d.parents : null].filter(Boolean).join(' · ');
  const detailLine = details ? <p style={{ margin: 0, fontSize: `${2.8 * s.scale}mm`, opacity: 0.9 }}>{details}</p> : null;
  const gender = s.show.gender ? genderLine(d) : null;
  const genderLineEl = gender ? <p style={{ margin: 0, fontSize: `${2.8 * s.scale}mm`, fontWeight: 600, color: s.accent }}>{gender}</p> : null;
  // The middle part faces out once wrapped; the ends overlap at the back.
  const front: React.CSSProperties = { position: 'absolute', insetBlock: `${s.inset}mm`, insetInline: '45mm' };
  return (
    <div
      dir={d.dir}
      lang={d.lang}
      data-layout={s.layout}
      style={{ position: 'relative', width: `${width}mm`, height: `${height}mm`, overflow: 'hidden', color: s.ink, fontFamily: s.body, outline: cutLine ? '0.2mm solid #c9c2bd' : undefined, outlineOffset: '-0.1mm' }}
    >
      <Paper s={s} />
      {s.layout === 'band' ? (
        <>
          <div style={{ position: 'absolute', insetInline: 0, top: '30%', height: '40%', background: s.accent }} />
          <div style={{ ...front, insetBlock: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '3mm 0', textAlign: 'center' }}>
            {genderLineEl ?? <span />}
            {name(10.5, s.paper)}
            {detailLine ?? <span />}
          </div>
        </>
      ) : s.layout === 'split' ? (
        <>
          {!s.src ? <div style={{ position: 'absolute', inset: '2.5mm', border: `0.35mm solid ${s.accent}`, borderRadius: '2mm', opacity: 0.55 }} /> : null}
          <div style={{ ...front, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '4mm' }}>
            <div style={{ textAlign: 'center' }}>
              {genderLineEl}
              {name(10)}
            </div>
            <div style={{ width: '0.3mm', alignSelf: 'stretch', background: s.accent, opacity: 0.5 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2mm', textAlign: 'center' }}>
              {quote}
              {detailLine}
            </div>
          </div>
        </>
      ) : (
        <>
          {!s.src ? <div style={{ position: 'absolute', inset: '2.5mm', border: `0.35mm solid ${s.accent}`, borderRadius: '2mm', opacity: 0.55 }} /> : null}
          <div style={{ ...front, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: JUSTIFY[s.align], textAlign: 'center', gap: '0.6mm' }}>
            {name(10)}
            {quote}
            {detailLine}
          </div>
        </>
      )}
      {d.watermark ? <Watermark labels={d.labels} compact /> : null}
    </div>
  );
}

/** An A4 landscape sheet of three labels with light cut lines, at their real size. */
export function BottleSheet({ d }: { d: ProductData }) {
  return (
    <div style={{ width: '297mm', height: '210mm', position: 'relative', display: 'grid', placeContent: 'center', gap: `${PRODUCT_SIZES.bottle.gapMm}mm` }}>
      {[0, 1, 2].map((i) => (
        <BottleLabel key={i} d={{ ...d, watermark: false }} cutLine />
      ))}
      {d.watermark ? <Watermark labels={d.labels} /> : null}
    </div>
  );
}

/** Soft circles and a frame for the classic story without artwork. */
function SoftDecor({ accent }: { accent: string }) {
  const circle = (style: React.CSSProperties) => <div style={{ position: 'absolute', borderRadius: '50%', background: accent, opacity: 0.08, ...style }} />;
  return (
    <>
      {circle({ width: 700, height: 700, top: -260, insetInlineEnd: -260 })}
      {circle({ width: 520, height: 520, bottom: -180, insetInlineStart: -200 })}
      <div style={{ position: 'absolute', inset: 48, border: `3px solid ${accent}`, borderRadius: 40, opacity: 0.35 }} />
    </>
  );
}

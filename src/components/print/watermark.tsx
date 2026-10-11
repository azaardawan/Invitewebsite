import type React from 'react';

/**
 * The "preview" watermark on everything shown before payment: the extras and the card (print renders) and the
 * customer's live preview of a files-only design. Dense, large diagonal marks over the whole picture, and the
 * note that they go away after purchase across the middle, so cropping cannot remove it. No fonts imported:
 * it uses whatever Arabic font the page already has (system fallback otherwise).
 */
export type WatermarkText = { watermark: string; watermarkNote: string };

/** One tile: the mark twice, staggered, so the repeat leaves no clean rows. */
function tileUrl(mark: string) {
  const text = mark.replace(/[<&>]/g, '');
  const t = (x: number, y: number) =>
    `<text x="${x}" y="${y}" text-anchor="middle" font-family="Noto Sans Arabic, Vazirmatn, Tahoma, sans-serif" font-size="38" font-weight="800" fill="rgba(70,32,42,0.42)" stroke="rgba(255,255,255,0.45)" stroke-width="0.8" transform="rotate(-28 ${x} ${y})">${text}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="190">${t(90, 65)}${t(250, 160)}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function WatermarkLayer({
  text,
  compact = false,
  fixed = false,
  noteSize,
}: {
  text: WatermarkText;
  /** Small pictures (sticker, bottle label): marks sized to the picture so a few stay big. */
  compact?: boolean;
  /** Over a whole page that scrolls (the live preview): stays in view. */
  fixed?: boolean;
  /** Font size of the note (default: relative to the picture for `compact`, 1.15em otherwise). */
  noteSize?: string;
}) {
  // A size container, so marks and note scale with the picture (a wide bottle label by its height).
  const box: React.CSSProperties = { position: fixed ? 'fixed' : 'absolute', inset: 0, zIndex: 2147483000, pointerEvents: 'none', overflow: 'hidden', containerType: 'size' };
  return (
    <div aria-hidden style={box} data-bahja-watermark="">
      <div style={{ position: 'absolute', inset: 0, backgroundImage: tileUrl(text.watermark), backgroundSize: compact ? 'min(62cqw, 100cqh) auto' : fixed ? '280px auto' : '40% auto' }} />
      <div
        style={{
          position: 'absolute',
          insetInline: 0,
          // Across the middle (over the name), so no crop can keep the picture and lose the note.
          top: '50%',
          transform: compact ? 'translateY(-50%) rotate(-4deg) scale(1.1)' : 'translateY(-50%) rotate(-8deg) scale(1.15)',
          background: 'rgba(43,26,30,0.66)',
          color: '#fff',
          textAlign: 'center',
          fontFamily: 'Noto Sans Arabic, Vazirmatn, Tahoma, sans-serif',
          fontWeight: 700,
          fontSize: noteSize ?? (compact ? 'min(6cqw, 7.5cqh)' : fixed ? '17px' : 'min(3.6cqw, 2.4cqh)'),
          padding: compact ? '2% 6%' : '0.7em 1.2em',
          lineHeight: 1.4,
        }}
      >
        {text.watermarkNote}
      </div>
    </div>
  );
}

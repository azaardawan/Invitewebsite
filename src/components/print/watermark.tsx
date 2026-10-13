import type React from 'react';

/**
 * The "preview" mark on everything shown before payment: the extras and the card (print renders) and the
 * customer's live preview of a files-only design. Only the note that it goes away after purchase (owner's
 * choice: no repeated marks), well inside the picture (off the name, see-through so the design stays
 * readable), so cropping cannot remove it without cutting the design. No fonts imported: it uses whatever
 * Arabic font the page already has (system fallback otherwise).
 */
export type WatermarkText = { watermark: string; watermarkNote: string };

export function WatermarkLayer({
  text,
  compact = false,
  fixed = false,
  noteSize,
}: {
  text: WatermarkText;
  /** Small pictures (sticker, bottle label): the note sized to the picture. */
  compact?: boolean;
  /** Over a whole page that scrolls (the live preview): stays in view. */
  fixed?: boolean;
  /** Font size of the note (default: relative to the picture for `compact`, 1.15em otherwise). */
  noteSize?: string;
}) {
  // A size container, so the note scales with the picture (a wide bottle label by its height).
  const box: React.CSSProperties = { position: fixed ? 'fixed' : 'absolute', inset: 0, zIndex: 2147483000, pointerEvents: 'none', overflow: 'hidden', containerType: 'size' };
  return (
    <div aria-hidden style={box} data-bahja-watermark="">
      <div
        style={{
          position: 'absolute',
          insetInline: 0,
          // Inside the picture but below the name: no crop keeps the design and loses it.
          top: compact ? '71%' : '68%',
          transform: compact ? 'translateY(-50%) rotate(-4deg)' : 'translateY(-50%) rotate(-8deg) scale(1.15)',
          // See-through, so the design's own text reads through it.
          background: 'rgba(43,26,30,0.36)',
          color: '#fff',
          textShadow: '0 1px 3px rgba(43,26,30,0.7)',
          textAlign: 'center',
          fontFamily: 'Noto Sans Arabic, Vazirmatn, Tahoma, sans-serif',
          fontWeight: 700,
          fontSize: noteSize ?? (compact ? 'min(4.8cqw, 7cqh)' : fixed ? '17px' : 'min(3.6cqw, 2.4cqh)'),
          padding: compact ? '2% 6%' : '0.7em 1.2em',
          lineHeight: 1.4,
        }}
      >
        {text.watermarkNote}
      </div>
    </div>
  );
}

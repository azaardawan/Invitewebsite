/**
 * Pictures of what the package's extras will look like with the customer's own details (printable card,
 * Instagram story, chocolate sticker, bottle label). Before payment they come watermarked from the server; a
 * note says the watermark goes away after purchase. After payment (receipt) the same pictures are clean.
 */
export function ExtrasPreview({
  base,
  featureKeys,
  stickerShape,
  labels,
  watermarked,
  downloads,
  cards,
}: {
  /** Where the pictures come from, e.g. `/p/<token>/extra` (draft) or `/r/<token>/extra` (receipt). */
  base: string;
  featureKeys: readonly string[];
  /** `both`: a round set (sticker.*) and a square set (sticker-square.*), each shown and downloadable. */
  stickerShape: 'round' | 'square' | 'both';
  labels: {
    title: string;
    note: string;
    card: string;
    /** The card's back, shown next to its front. */
    cardBack: string;
    story: string;
    sticker: string;
    bottle: string;
    downloadPng: string;
    downloadSheet: string;
    /** The two shapes' names, to tell the sets apart when both were chosen. */
    round?: string;
    square?: string;
  };
  watermarked: boolean;
  /** Receipt only: download links per item. */
  downloads?: boolean;
  /**
   * The printed cards the customer ticked (the A5 card and/or shapes), each pictured front and back. `label` names a
   * shape (left out for the A5 card); `ratio` / `backRatio` are width ÷ height. Left out: the A5 card.
   */
  cards?: { key: string; label?: string; ratio: number; backRatio: number }[];
}) {
  const cardList = cards?.length ? cards : [{ key: 'a5', ratio: 148 / 210, backRatio: 210 / 148 }];
  // Only the A5 card: the same pictures and addresses as before; with shapes, each card is named and asked for by key.
  const many = cardList.length > 1 || cardList[0]!.key !== 'a5';
  const cardItems =
    featureKeys.includes('print_card') && !downloads
      ? cardList.flatMap((c) => {
          const q = many ? `?card=${encodeURIComponent(c.key)}` : '';
          const name = (side: string) => (c.label ? `${side} · ${c.label}` : side);
          return [
            { key: many ? `card-${c.key}` : 'card', label: name(labels.card), src: `${base}/card.preview${q}`, box: 'w-40', style: { aspectRatio: String(c.ratio) } },
            { key: many ? `card-back-${c.key}` : 'card-back', label: name(labels.cardBack), src: `${base}/cardBack.preview${q}`, box: c.backRatio > 1 ? 'w-56' : 'w-40', style: { aspectRatio: String(c.backRatio) } },
          ];
        })
      : [];
  const items = [
    ...cardItems,
    featureKeys.includes('story') ? { key: 'story', label: labels.story, src: `${base}/story.preview`, box: 'aspect-[9/16] w-40', png: `${base}/story.png` } : null,
    featureKeys.includes('sticker')
      ? {
          key: 'sticker',
          label: stickerShape === 'both' ? `${labels.sticker} · ${labels.round}` : labels.sticker,
          src: `${base}/sticker.preview`,
          box: `aspect-square w-32 ${stickerShape === 'square' ? 'rounded-xl' : 'rounded-full'}`,
          png: `${base}/sticker.png`,
          sheet: `${base}/sticker.pdf`,
        }
      : null,
    featureKeys.includes('sticker') && stickerShape === 'both'
      ? {
          key: 'sticker-square',
          label: `${labels.sticker} · ${labels.square}`,
          src: `${base}/sticker-square.preview`,
          box: 'aspect-square w-32 rounded-xl',
          png: `${base}/sticker-square.png`,
          sheet: `${base}/sticker-square.pdf`,
        }
      : null,
    featureKeys.includes('bottle_label') ? { key: 'bottle', label: labels.bottle, src: `${base}/bottle.preview`, box: 'aspect-[215/55] w-72', png: `${base}/bottle.png`, sheet: `${base}/bottle.pdf` } : null,
  ].filter((i): i is NonNullable<typeof i> => i !== null);
  if (!items.length) return null;
  return (
    <section aria-labelledby="extras-title" className="flex flex-col gap-4" id="extras">
      <h2 id="extras-title" className="text-xl font-semibold text-heading">
        {labels.title}
      </h2>
      {watermarked ? (
        <p role="note" className="rounded-2xl bg-gold-soft/30 px-4 py-3 text-sm font-medium text-heading">
          {labels.note}
        </p>
      ) : null}
      <ul className="flex flex-wrap items-end gap-6">
        {items.map((i) => (
          <li key={i.key} className="flex flex-col items-center gap-2" data-extra={i.key}>
            {/* Rendered on the server (watermarked until paid); a few seconds the first time. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- generated picture */}
            <img src={i.src} alt={i.label} loading="lazy" className={`${i.box} border border-line bg-paper object-contain shadow-sm`} style={'style' in i ? i.style : undefined} />
            <span className="text-sm font-medium text-heading">{i.label}</span>
            {downloads ? (
              <span className="flex gap-3 text-xs">
                {'png' in i && i.png ? (
                  <a href={i.png} download className="font-medium text-accent underline">
                    {labels.downloadPng}
                  </a>
                ) : null}
                {'sheet' in i && i.sheet ? (
                  <a href={i.sheet} download className="font-medium text-accent underline">
                    {labels.downloadSheet}
                  </a>
                ) : null}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

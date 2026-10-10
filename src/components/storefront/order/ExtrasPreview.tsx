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
}: {
  /** Where the pictures come from, e.g. `/p/<token>/extra` (draft) or `/r/<token>/extra` (receipt). */
  base: string;
  featureKeys: readonly string[];
  stickerShape: 'round' | 'square';
  labels: { title: string; note: string; card: string; story: string; sticker: string; bottle: string; downloadPng: string; downloadSheet: string };
  watermarked: boolean;
  /** Receipt only: download links per item. */
  downloads?: boolean;
}) {
  const items = [
    featureKeys.includes('print_card') && !downloads ? { key: 'card', label: labels.card, src: `${base}/card.preview`, box: 'aspect-[148/210] w-40' } : null,
    featureKeys.includes('story') ? { key: 'story', label: labels.story, src: `${base}/story.preview`, box: 'aspect-[9/16] w-40', png: `${base}/story.png` } : null,
    featureKeys.includes('sticker')
      ? { key: 'sticker', label: labels.sticker, src: `${base}/sticker.preview`, box: `aspect-square w-32 ${stickerShape === 'round' ? 'rounded-full' : 'rounded-xl'}`, png: `${base}/sticker.png`, sheet: `${base}/sticker.pdf` }
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
            <img src={i.src} alt={i.label} loading="lazy" className={`${i.box} border border-line bg-paper object-contain shadow-sm`} />
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

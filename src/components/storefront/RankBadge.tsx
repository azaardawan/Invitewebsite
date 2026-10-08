/**
 * The owner's top 3 badge on a theme: "Best seller" (gold, with a crown) for the first, "Top pick" for the
 * second and third. Placed over the top of the theme's arch by the caller.
 */
export function RankBadge({ rank, labels, className = '' }: { rank: number | null | undefined; labels: { bestSeller: string; topPick: string }; className?: string }) {
  if (!rank) return null;
  const best = rank === 1;
  return (
    <span
      data-rank={rank}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap shadow-[0_6px_16px_rgb(74_19_34/0.18)] lg:text-sm ${
        best ? 'bg-gradient-to-b from-gold-soft to-gold text-white' : 'border border-gold-soft bg-surface text-accent'
      } ${className}`}
    >
      {best ? (
        <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5L3 7z" />
        </svg>
      ) : (
        <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L12 17.8 5.7 21.5l1.7-7.3L2 9.5l7.1-.6z" />
        </svg>
      )}
      {best ? labels.bestSeller : labels.topPick}
    </span>
  );
}

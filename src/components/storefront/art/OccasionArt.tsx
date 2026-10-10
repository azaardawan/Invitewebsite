/** Owner-supplied artwork (transparent WebP in `public/occasion-art/`), keyed by occasion. */
const ART = ['wedding', 'engagement', 'graduation', 'birthday', 'newborn'] as const;
type ArtKey = (typeof ART)[number];

/** Built-in occasion for a section key. The newborn section is created in Admin, so its key may vary. */
function artKey(sectionKey: string): ArtKey | null {
  if ((ART as readonly string[]).includes(sectionKey)) return sectionKey as ArtKey;
  if (/newborn|new-born|baby|aqiqa|aqeeqa|birth(?!day)/.test(sectionKey)) return 'newborn';
  return null;
}

/** Artwork for the built-in occasions; other sections fall back to their uploaded image or a star. */
export function OccasionArt({ sectionKey, className }: { sectionKey: string; className?: string }) {
  const key = artKey(sectionKey);
  if (key) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/occasion-art/${key}.webp`} alt="" width={512} height={512} loading="lazy" decoding="async" className={`object-contain ${className ?? ''}`} />;
  }
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden stroke="#a8834f" strokeWidth="2">
      <path d="M60 18l9 22 23 2-17 16 5 23-20-12-20 12 5-23-17-16 23-2z" />
    </svg>
  );
}

/** Arch tile colour per built-in occasion (others alternate). */
export function occasionTone(sectionKey: string, index: number) {
  const tones: Record<ArtKey, string> = {
    wedding: 'bg-accent text-accent-ink',
    engagement: 'bg-blush text-accent-deep',
    graduation: 'bg-plum text-accent-ink',
    birthday: 'bg-sand text-heading',
    newborn: 'bg-paper text-heading border border-line',
  };
  const fallback = ['bg-paper text-heading border border-line', 'bg-blush text-accent-deep', 'bg-sand text-heading'];
  const key = artKey(sectionKey);
  return key ? tones[key] : fallback[index % fallback.length]!;
}

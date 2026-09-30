/** Line illustrations for the built-in occasions; other sections fall back to their uploaded image or a star. */
export function OccasionArt({ sectionKey, className }: { sectionKey: string; className?: string }) {
  const common = { className, viewBox: '0 0 120 120', fill: 'none', 'aria-hidden': true } as const;
  switch (sectionKey) {
    case 'wedding':
      return (
        <svg {...common} stroke="#d9b77c" strokeWidth="2.5">
          <circle cx="48" cy="70" r="26" />
          <circle cx="74" cy="70" r="26" />
          <path d="M60 22l8 10-8 10-8-10z" fill="#d9b77c" />
        </svg>
      );
    case 'engagement':
      return (
        <svg {...common}>
          <path d="M60 64v40M60 70l-18 30M60 70l18 30" stroke="#8e9a7e" strokeWidth="3" />
          <circle cx="60" cy="42" r="16" fill="#b5475f" />
          <circle cx="60" cy="42" r="8" fill="#9b3550" />
          <circle cx="36" cy="56" r="12" fill="#e3a3ae" />
          <circle cx="84" cy="56" r="12" fill="#e3a3ae" />
          <circle cx="36" cy="56" r="5" fill="#d2828f" />
          <circle cx="84" cy="56" r="5" fill="#d2828f" />
          <path d="M50 86c6 6 14 6 20 0" stroke="#6e1f33" strokeWidth="3" />
        </svg>
      );
    case 'graduation':
      return (
        <svg {...common} stroke="#d9b77c" strokeWidth="2.5" strokeLinejoin="round">
          <path d="M10 50l50-22 50 22-50 22z" />
          <path d="M32 60v24c0 8 56 8 56 0V60" />
          <path d="M96 54v26" />
          <circle cx="96" cy="84" r="4" fill="#d9b77c" />
        </svg>
      );
    case 'birthday':
      return (
        <svg {...common} stroke="#6e1f33" strokeWidth="2.5" strokeLinejoin="round">
          <rect x="24" y="66" width="72" height="34" rx="6" />
          <rect x="36" y="44" width="48" height="22" rx="5" />
          <path d="M24 80c12 8 24-8 36 0s24 8 36 0" />
          <path d="M48 44V32M60 44V28M72 44V32" />
          <path d="M48 24c-3 3-3 6 0 7 3-1 3-4 0-7zM60 20c-3 3-3 6 0 7 3-1 3-4 0-7zM72 24c-3 3-3 6 0 7 3-1 3-4 0-7z" fill="#b5475f" stroke="none" />
        </svg>
      );
    default:
      return (
        <svg {...common} stroke="#a8834f" strokeWidth="2">
          <path d="M60 18l9 22 23 2-17 16 5 23-20-12-20 12 5-23-17-16 23-2z" />
        </svg>
      );
  }
}

/** Arch tile colour per built-in occasion (others alternate). */
export function occasionTone(sectionKey: string, index: number) {
  const tones: Record<string, string> = {
    wedding: 'bg-accent text-accent-ink',
    engagement: 'bg-blush text-accent-deep',
    graduation: 'bg-plum text-accent-ink',
    birthday: 'bg-sand text-heading',
  };
  const fallback = ['bg-paper text-heading border border-line', 'bg-blush text-accent-deep', 'bg-sand text-heading'];
  return tones[sectionKey] ?? fallback[index % fallback.length]!;
}

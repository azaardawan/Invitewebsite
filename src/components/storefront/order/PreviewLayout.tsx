import type { ReactNode } from 'react';

/**
 * The order form with its live preview (owner, 2026-11-26): beside the form on a computer, where it stays in view as
 * the form scrolls; pinned on top on a phone (the preview is then a direct child of the tall column, so it sticks).
 */
export function PreviewLayout({ preview, children }: { preview: ReactNode | null; children: ReactNode }) {
  if (!preview) return <>{children}</>;
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12">
      <aside className="contents lg:order-last lg:block lg:w-[400px] lg:shrink-0 lg:self-stretch xl:w-[440px]">{preview}</aside>
      <div className="min-w-0 flex-1 lg:max-w-[640px]">{children}</div>
    </div>
  );
}

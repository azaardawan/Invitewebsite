/** A theme's permanent number ("No. 7"), the short way to name a theme when asking for a change. */
export function ThemeNumber({ n, label }: { n: number | undefined; label: string }) {
  if (n === undefined) return null;
  return (
    <span title={label} className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 font-mono text-sm font-semibold text-accent-ink" dir="ltr">
      #{n}
    </span>
  );
}

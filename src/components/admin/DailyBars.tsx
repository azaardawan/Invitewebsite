/**
 * Daily single-series bar chart (server-rendered SVG, no JS). One hue (validated against the admin
 * surface), 4px rounded data-ends on the baseline, 2px gaps, recessive grid. Hovering a day shows its
 * values (native tooltip on a full-height hit area); a table view follows the chart.
 */
export function DailyBars({
  points,
  label,
  dayLabels,
}: {
  /** One bar per day; `title` is the hover text. */
  points: { day: string; value: number; title: string }[];
  label: string;
  /** Short date labels for the first, middle and last day. */
  dayLabels: Record<string, string>;
}) {
  const W = 720;
  const H = 180;
  const pad = { top: 12, right: 8, bottom: 24, left: 32 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...points.map((p) => p.value));
  const nice = max <= 5 ? max : Math.ceil(max / 5) * 5;
  const slot = plotW / Math.max(points.length, 1);
  const barW = Math.min(40, Math.max(2, slot - 2));
  const ticks = [...new Set([0, nice / 2, nice].map((v) => Math.round(v)))];
  const y = (v: number) => pad.top + plotH - (v / nice) * plotH;
  const labelIdx = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);

  return (
    <figure className="space-y-2" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="#e3cfc6" strokeWidth={1} />
            <text x={pad.left - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#5e4a4f">
              {t}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = pad.left + i * slot + (slot - barW) / 2;
          const h = (p.value / nice) * plotH;
          const base = pad.top + plotH;
          const top = base - h;
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={p.day}>
              {h > 0 ? (
                <path
                  d={`M${x},${base} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + barW - r},${top} Q${x + barW},${top} ${x + barW},${top + r} L${x + barW},${base} Z`}
                  fill="#9b3a52"
                />
              ) : null}
              <rect x={pad.left + i * slot} y={pad.top} width={slot} height={plotH} fill="transparent">
                <title>{p.title}</title>
              </rect>
              {labelIdx.has(i) ? (
                <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#5e4a4f">
                  {dayLabels[p.day]}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}

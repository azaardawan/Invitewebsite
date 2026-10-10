import { MM, type SheetLayout } from '@/catalog/kit';
import type { KitProps } from '@/theme-sdk/types';
import { KitUnit } from './KitUnit';
import styles from './kit.module.css';

const MARK_GAP = 1; // mm between the bleed edge and a crop mark
const MARK_LEN = 4; // mm

/**
 * A printed page: copies of the unit placed by the platform's sheet layout,
 * with crop marks (cards, bottle wraps) or a dashed cutting guide (stickers).
 */
export function KitSheet({ codeRef, props, layout }: { codeRef: string; props: KitProps; layout: SheetLayout }) {
  const g = props.size;
  const bleed = g.bleed / MM;
  const trimW = g.trimMm!.w;
  const trimH = g.trimMm!.h;
  const marks: string[] = [];
  const guides: { x: number; y: number }[] = [];
  for (const it of layout.items) {
    const x0 = it.x + bleed;
    const y0 = it.y + bleed;
    const x1 = x0 + trimW;
    const y1 = y0 + trimH;
    if (layout.cropMarks) {
      const o = bleed + MARK_GAP;
      for (const x of [x0, x1]) {
        marks.push(`M${x} ${y0 - o}V${y0 - o - MARK_LEN}`, `M${x} ${y1 + o}V${y1 + o + MARK_LEN}`);
      }
      for (const y of [y0, y1]) {
        marks.push(`M${x0 - o} ${y}H${x0 - o - MARK_LEN}`, `M${x1 + o} ${y}H${x1 + o + MARK_LEN}`);
      }
    }
    if (layout.cutGuide) guides.push({ x: x0, y: y0 });
  }

  return (
    <div className={styles.page} style={{ width: `${layout.pageW}mm`, height: `${layout.pageH}mm` }}>
      <style>{`@page { size: ${layout.pageW}mm ${layout.pageH}mm; margin: 0; }`}</style>
      {layout.items.map((it, i) => (
        <div key={i} className={styles.item} style={{ left: `${it.x}mm`, top: `${it.y}mm` }}>
          <KitUnit codeRef={codeRef} props={props} clip="bleed" />
        </div>
      ))}
      <svg className={styles.marks} viewBox={`0 0 ${layout.pageW} ${layout.pageH}`} aria-hidden>
        {marks.length ? <path d={marks.join('')} stroke="#000" strokeWidth={0.2} fill="none" /> : null}
        {guides.map((p, i) =>
          g.shape === 'circle' ? (
            <circle key={i} cx={p.x + trimW / 2} cy={p.y + trimH / 2} r={trimW / 2} fill="none" stroke="#9a9a9a" strokeWidth={0.15} strokeDasharray="1 1" />
          ) : (
            <rect key={i} x={p.x} y={p.y} width={trimW} height={trimH} rx={2} fill="none" stroke="#9a9a9a" strokeWidth={0.15} strokeDasharray="1 1" />
          ),
        )}
      </svg>
    </div>
  );
}

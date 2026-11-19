import type { CSSProperties } from 'react';
import { monogram, sealText } from '../initials';

/**
 * The couple's monogram engraved in a printed crest's pink shield: the invitation's wax-seal letters in calligraphy
 * (ROC Mono), the join small between them. The piece's stylesheet places it (`className`) on its artwork's shield and
 * sets its base size; `--fit` shrinks a pair of wide letters.
 */
export function PrintInitials({
  fields,
  join,
  className,
}: {
  fields: Readonly<Partial<Record<string, string>>>;
  join: string | undefined;
  className?: string;
}) {
  const seal = sealText(fields, join ?? '&');
  if (!seal) return null;
  const m = monogram(seal);
  return (
    <span className={className} style={{ '--fit': m.fit.toFixed(3) } as CSSProperties} dir={m.rtl ? 'rtl' : 'ltr'} aria-hidden="true">
      <b>{m.first}</b>
      {m.join ? <i>{m.join}</i> : null}
      {m.second ? <b>{m.second}</b> : null}
    </span>
  );
}

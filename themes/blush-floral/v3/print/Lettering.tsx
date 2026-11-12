import type { PrintCardProps } from '@/theme-sdk';
import { copyFor } from '../copy';
import { PosterLine, posterDetails, posterLines } from '../poster';

/** The poster's lettering with the customer's lines, in poster units (0 0 297.75 419.25), as on the invitation. */
export function Lettering({ locale, fields, event, extraLine }: Pick<PrintCardProps, 'locale' | 'fields' | 'event' | 'extraLine'>) {
  const t = copyFor(locale);
  const local = locale !== 'en';
  const name = fields.person_1_name?.trim() ?? '';
  const venue = fields.venue_name?.trim() ?? '';
  const specs = posterLines(t, name, posterDetails(event.date, event.time, t.posterSoon), venue, local);
  return (
    <>
      {(Object.keys(specs) as (keyof typeof specs)[]).map((k) => (specs[k].text ? <PosterLine key={k} p="" k={k} spec={specs[k]} still /> : null))}
      {extraLine ? (
        <PosterLine
          p=""
          k="address"
          still
          spec={{ text: extraLine, y: venue ? (local ? 410 : 396) : local ? 399 : 385.6, size: 6, max: 170, fill: '#be2026', track: 1.2, italic: true }}
        />
      ) : null}
    </>
  );
}

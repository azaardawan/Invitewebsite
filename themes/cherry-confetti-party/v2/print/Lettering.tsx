import type { PrintCardProps } from '@/theme-sdk';
import { copyFor } from '../copy';
import { PosterLine, posterDetails } from '../poster';

/** The poster's lettering with the customer's lines, in poster units (0 0 297.75 419.25), as on the invitation. */
export function Lettering({ locale, fields, event, extraLine }: Pick<PrintCardProps, 'locale' | 'fields' | 'event' | 'extraLine'>) {
  const t = copyFor(locale);
  const name = fields.person_1_name?.trim() ?? '';
  const venue = fields.venue_name?.trim() ?? '';
  const fill = (text: string) => text.replace('{name}', name);
  return (
    <>
      <PosterLine text={t.posterEyebrow} y={211} size={6.8} max={150} kind="serif" track={0.5} />
      <PosterLine text={fill(t.posterBig)} y={268} size={53} max={185} kind="script" />
      <PosterLine text={fill(t.posterSmall)} y={312} size={29} max={185} kind="script" />
      <PosterLine text={posterDetails(event.date, event.time, t.posterSoon)} y={352} size={11} max={208} kind="serif" track={0.6} />
      {venue ? <PosterLine text={venue} y={383} size={6.7} max={170} kind="serif" track={0.55} /> : null}
      {extraLine ? <PosterLine text={extraLine} y={venue ? 396 : 383} size={6} max={150} kind="serif" track={0.4} /> : null}
    </>
  );
}

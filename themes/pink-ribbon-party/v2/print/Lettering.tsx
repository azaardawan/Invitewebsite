import type { PrintCardProps } from '@/theme-sdk';
import { copyFor } from '../copy';
import { PosterLine, posterDetails } from '../poster';

/** The poster's lettering with the customer's lines, in poster units (0 0 297.75 419.25), as on the invitation. */
export function Lettering({ locale, fields, event, extraLine }: Pick<PrintCardProps, 'locale' | 'fields' | 'event' | 'extraLine'>) {
  const t = copyFor(locale);
  const local = locale !== 'en';
  const name = fields.person_1_name?.trim() ?? '';
  const venue = fields.venue_name?.trim() ?? '';
  const fill = (text: string) => text.replace('{name}', name);
  return (
    <>
      <PosterLine text={t.posterEyebrow} y={63} size={7.5} max={180} kind="serif" track={0.6} />
      {local ? <PosterLine text={t.posterHappy} y={128} size={40} max={190} kind="script" /> : null}
      <PosterLine text={fill(t.posterName)} y={280} size={40} max={180} kind="script" />
      <PosterLine text={posterDetails(event.date, event.time, t.posterSoon)} y={321} size={11} max={200} kind="serif" track={0.45} />
      {venue ? <PosterLine text={venue} y={355} size={6.5} max={180} kind="serif" track={0.35} /> : null}
      {extraLine ? <PosterLine text={extraLine} y={venue ? 368 : 355} size={6} max={160} kind="serif" track={0.35} /> : null}
    </>
  );
}

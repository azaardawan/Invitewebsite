import { sealText } from '../initials';

/**
 * The couple's initials engraved in a printed crest's pink shield, the same letters as the invitation's wax seal.
 * The piece's stylesheet places it (`className`) on its artwork's shield.
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
  const text = 'custom' in seal ? seal.custom : [seal.first, seal.join, seal.second].filter(Boolean).join(' ');
  return (
    <span className={className} aria-hidden="true" dir="auto">
      {text}
    </span>
  );
}

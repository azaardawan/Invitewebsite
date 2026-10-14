import type { SealText } from './initials';
import { sealLength } from './initials';
import o from './opening.module.css';

/**
 * The closed envelope: four flaps cut from one picture along its fold lines, the gold wax seal with the
 * couple's initials on top, and the light that opens it. Purely visual; the open button is outside.
 */
export function Envelope({ seal, onOpen }: { seal: SealText | null; onOpen: () => void }) {
  return (
    <div className={o.envelope} onClick={onOpen} aria-hidden="true">
      <span className={`${o.flap} ${o.flapLeft}`} />
      <span className={`${o.flap} ${o.flapRight}`} />
      <span className={`${o.flap} ${o.flapBottom}`} />
      <span className={`${o.flap} ${o.flapTop}`} />
      <span className={o.glow} />
      <span className={o.seal}>
        <span className={o.sealArt} />
        {seal ? <SealLetters seal={seal} /> : null}
      </span>
      <span className={o.shine} />
    </div>
  );
}

function SealLetters({ seal }: { seal: SealText }) {
  const n = sealLength(seal);
  // Fewer letters, larger; always inside the seal's flat face with room to spare.
  const size = n <= 3 ? 'l' : n <= 5 ? 'm' : n <= 7 ? 's' : 'xs';
  return (
    <span className={o.letters} data-size={size} dir="auto">
      {'custom' in seal ? (
        seal.custom
      ) : (
        <>
          {seal.first}
          {seal.join ? (
            <span className={o.join}>{seal.join === '♥' ? <Heart /> : seal.join}</span>
          ) : null}
          {seal.second}
        </>
      )}
    </span>
  );
}

/** The fonts have no heart, and phones would draw a red emoji: a small heart in the letters' own colour. */
function Heart() {
  return (
    <svg viewBox="0 0 24 22" width="0.62em" height="0.56em" fill="currentColor" aria-hidden="true">
      <path d="M12 21.5 10.3 20C4.2 14.6 0 10.9 0 6.4 0 2.8 2.8 0 6.4 0c2 0 4 .9 5.6 2.4C13.6.9 15.6 0 17.6 0 21.2 0 24 2.8 24 6.4c0 4.5-4.2 8.2-10.3 13.6Z" />
    </svg>
  );
}

import p from './print.module.css';

/** The heritage diamond (same artwork as on screen). */
export function Diamond({ small = false }: { small?: boolean }) {
  return (
    <svg className={small ? p.diamondSmall : p.diamond} viewBox="0 0 64 64" aria-hidden="true">
      <path fill="#a45436" d="M32 2 62 32 32 62 2 32z" />
      <path fill="#bf9555" d="M32 11 53 32 32 53 11 32z" />
      <path fill="#fbf2e2" d="M32 19 45 32 32 45 19 32z" />
      <path fill="#2c6465" d="M32 25 39 32 32 39 25 32z" />
    </svg>
  );
}

export function Names({ first, second, and, className }: { first: string | undefined; second: string | undefined; and: string; className: string | undefined }) {
  return (
    <h1 className={className}>
      <span>{first}</span>
      {first && second ? <span className={p.amp}>{and}</span> : null}
      <span>{second}</span>
    </h1>
  );
}

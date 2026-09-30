import styles from './invite-art.module.css';

export type InviteVariant = 'velvet' | 'night' | 'blush' | 'ivory' | 'rose';
export type InviteText = { name1: string; name2: string; caption: string; date: string };

const Star = () => (
  <svg width="46" height="16" viewBox="0 0 46 16" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
    <path d="M23 1l2 5 5 .6-3.8 3.4 1.1 5-4.3-2.6-4.3 2.6 1.1-5L16 6.6l5-.6z" />
    <path d="M2 9h11M33 9h11" />
  </svg>
);

/** Decorative illustrated invitation (brand art). Not a real theme: purely for the storefront. */
export function InviteArt({ variant, text, and }: { variant: InviteVariant; text: InviteText; and: string }) {
  const names = (
    <>
      <span className={styles.caption}>{text.caption}</span>
      <span className={styles.name}>{text.name1}</span>
      <span className={styles.and}>{and}</span>
      <span className={styles.name}>{text.name2}</span>
    </>
  );
  return (
    <div className={`${styles.card} ${styles[variant]}`} aria-hidden>
      {variant === 'velvet' ? (
        <>
          <span className={styles.frame} />
          <span className={styles.frame2} />
          <div className={styles.body}>
            <Star />
            {names}
            <span className={styles.rule} />
            <span className={styles.date}>{text.date}</span>
          </div>
        </>
      ) : null}
      {variant === 'night' ? (
        <>
          <span className={styles.frame} />
          <svg className={styles.sky} width="120" height="56" viewBox="0 0 120 56" fill="#d9b77c">
            <path d="M66 8a18 18 0 1 0 12 30 15 15 0 1 1-12-30z" />
            <circle cx="24" cy="18" r="1.4" />
            <circle cx="36" cy="40" r="1" />
            <circle cx="94" cy="14" r="1.2" />
            <circle cx="102" cy="36" r="1.6" />
            <circle cx="14" cy="42" r="1" />
            <path d="M30 6l1 3 3 .4-2.3 2 .6 3-2.3-1.5-2.3 1.5.6-3-2.3-2 3-.4z" />
          </svg>
          <div className={styles.body}>
            {names}
            <span className={styles.date}>{text.date}</span>
          </div>
        </>
      ) : null}
      {variant === 'blush' ? (
        <>
          <svg className={styles.flowersTop} width="120" height="96" viewBox="0 0 120 96">
            <ellipse cx="46" cy="30" rx="18" ry="7" transform="rotate(-30 46 30)" fill="#9da88b" />
            <ellipse cx="86" cy="62" rx="16" ry="6" transform="rotate(40 86 62)" fill="#8e9a7e" />
            <ellipse cx="30" cy="58" rx="14" ry="5" transform="rotate(20 30 58)" fill="#a9b397" />
            <circle cx="72" cy="34" r="20" fill="#b5475f" />
            <circle cx="72" cy="34" r="13" fill="#c45c72" />
            <circle cx="72" cy="34" r="7" fill="#9b3550" />
            <circle cx="100" cy="20" r="12" fill="#e3a3ae" />
            <circle cx="100" cy="20" r="7" fill="#edb9c2" />
            <circle cx="50" cy="12" r="8" fill="#edc3c9" />
          </svg>
          <span className={styles.frame} style={{ opacity: 0.25 }} />
          <div className={styles.body}>
            {names}
            <span className={styles.date}>{text.date}</span>
          </div>
        </>
      ) : null}
      {variant === 'ivory' ? (
        <>
          <span className={styles.lattice} />
          <span className={styles.frame} />
          <div className={styles.body}>
            {names}
            <span className={styles.date}>{text.date}</span>
          </div>
          <span className={styles.miniSeal}>ب</span>
        </>
      ) : null}
      {variant === 'rose' ? (
        <>
          <span className={styles.panel} />
          <svg className={styles.flowersBottom} width="200" height="70" viewBox="0 0 200 70">
            <ellipse cx="40" cy="44" rx="20" ry="7" transform="rotate(-20 40 44)" fill="#9da88b" />
            <ellipse cx="160" cy="46" rx="20" ry="7" transform="rotate(20 160 46)" fill="#9da88b" />
            <circle cx="70" cy="46" r="16" fill="#b5475f" />
            <circle cx="70" cy="46" r="9" fill="#9b3550" />
            <circle cx="100" cy="40" r="19" fill="#6e1f33" />
            <circle cx="100" cy="40" r="11" fill="#8b2a45" />
            <circle cx="130" cy="47" r="15" fill="#e3a3ae" />
            <circle cx="130" cy="47" r="8" fill="#d2828f" />
          </svg>
          <div className={styles.body}>
            {names}
            <span className={styles.date}>{text.date}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}

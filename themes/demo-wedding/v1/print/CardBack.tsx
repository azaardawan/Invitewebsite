import '@fontsource-variable/noto-sans-arabic';
import { Signature, type PrintCardBackProps } from '@/theme-sdk';
import styles from './print.module.css';

/** Internal demo: the back of the A5 card (same size and bleed as the front, its own layout). */
export default function DemoCardBack({ dir, lang, fields, labels, signature, title, message }: PrintCardBackProps) {
  return (
    <div className={`${styles.card} ${styles.back}`} dir={dir} lang={lang}>
      <h1 className={styles.backTitle}>{title}</h1>
      {message ? <p className={styles.backMessage}>{message}</p> : null}
      <Signature signature={signature} className={styles.backSignature} />
      {!signature ? <p className={styles.backNames}>{[fields.person_1_name, fields.person_2_name].filter(Boolean).join(` ${labels.and} `)}</p> : null}
    </div>
  );
}

import '@fontsource-variable/noto-sans-arabic';
import type { KeepsakeProps } from '@/theme-sdk';
import styles from './print.module.css';

/** Internal demo keepsake (A4). */
export default function DemoKeepsake({ dir, lang, fields, event, labels, messages }: KeepsakeProps) {
  return (
    <div className={styles.keepsake} dir={dir} lang={lang}>
      <section className={styles.cover}>
        <p>{labels.keepsakeTitle}</p>
        <h1 className={styles.names}>{[fields.person_1_name, fields.person_2_name].filter(Boolean).join(' & ')}</h1>
        {event.date ? <p>{event.date.full}</p> : null}
      </section>
      {messages.length === 0 ? <p>{labels.keepsakeEmpty}</p> : null}
      {messages.map((m, i) => (
        <article key={i} className={styles.entry}>
          <p>{m.message}</p>
          <p className={styles.from}>— {m.guestName}</p>
        </article>
      ))}
    </div>
  );
}

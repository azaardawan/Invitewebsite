import '@fontsource-variable/noto-sans-arabic';
import type { PrintCardProps } from '@/theme-sdk';
import styles from './print.module.css';

/** Internal demo print card (A5). */
export default function DemoCard({ dir, lang, fields, event, labels, qrDataUrl }: PrintCardProps) {
  return (
    <div className={styles.card} dir={dir} lang={lang}>
      <h1 className={styles.names}>{[fields.person_1_name, fields.person_2_name].filter(Boolean).join(' & ')}</h1>
      {fields.invitation_message ? <p className={styles.message}>{fields.invitation_message}</p> : null}
      <dl className={styles.details}>
        {event.date ? (
          <>
            <dt>{labels.date}</dt>
            <dd>{event.date.full}</dd>
          </>
        ) : null}
        {event.time ? (
          <>
            <dt>{labels.time}</dt>
            <dd>{event.time}</dd>
          </>
        ) : null}
        {fields.venue_name ? (
          <>
            <dt>{labels.venue}</dt>
            <dd>{fields.venue_name}</dd>
          </>
        ) : null}
      </dl>
      {qrDataUrl ? (
        <figure className={styles.qr}>
          {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
          <img src={qrDataUrl} alt="" width={90} height={90} />
          <figcaption>{labels.scanToOpen}</figcaption>
        </figure>
      ) : null}
    </div>
  );
}

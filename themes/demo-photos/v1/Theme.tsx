'use client';

import { GuestFormSlot, Photo, type ThemeProps } from '@/theme-sdk';
import styles from './theme.module.css';

/** The customer's first photo on the cover, the others in a gallery below (any number from none to seven). */
export default function DemoPhotosTheme({ fields, labels, event, photos }: ThemeProps) {
  const [cover, ...rest] = photos;
  return (
    <main className={styles.page}>
      <article className={styles.card}>
        {cover ? <Photo photo={cover} eager className={styles.cover} /> : null}
        <h1 className={styles.names}>
          {[fields.person_1_name, fields.person_2_name].filter(Boolean).join(` ${labels.and} `)}
        </h1>
        {event.date ? <p className={styles.line}>{event.date.full}</p> : null}
        {event.time ? <p className={styles.line}>{event.time}</p> : null}
        {fields.venue_name ? <p className={styles.line}>{fields.venue_name}</p> : null}
        {rest.length ? (
          <ul className={styles.gallery} data-demo-gallery={rest.length}>
            {rest.map((p, i) => (
              <li key={i}>
                <Photo photo={p} className={styles.thumb} />
                {p.label ? <span className={styles.caption}>{p.label}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
        <GuestFormSlot render={(form) => (form.status === 'sent' ? <p role="status">{labels.sent}</p> : <p className={styles.line}>{labels.guestFormTitle}</p>)} />
      </article>
    </main>
  );
}

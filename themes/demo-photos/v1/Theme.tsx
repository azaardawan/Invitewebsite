'use client';

import { Photo, type ThemeProps } from '@/theme-sdk';
import styles from './theme.module.css';

/** Each collage spot's shape (the same as the manifest's `photos.frames`); a wide spot takes the whole row. */
const COLLAGE = [1.6, 1, 1, 0.75, 0.75, 1.6];

/** The customer's first photo on the cover, the others in a collage below (any number from none to seven). */
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
              <li key={i} style={{ gridColumn: COLLAGE[i]! > 1 ? '1 / -1' : undefined }}>
                <Photo photo={p} className={styles.thumb} style={{ aspectRatio: String(COLLAGE[i]) }} />
                {p.label ? <span className={styles.caption}>{p.label}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </main>
  );
}

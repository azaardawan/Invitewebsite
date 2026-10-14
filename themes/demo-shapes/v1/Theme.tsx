'use client';

import { useState } from 'react';
import { GuestFormSlot, useMusic, type GuestAttendance, type ThemeProps } from '@/theme-sdk';
import styles from './theme.module.css';

/** Minimal light demo: no cover animation, just a tap-to-start music strip. */
export default function DemoMinimalTheme({ fields, labels, event }: ThemeProps) {
  const music = useMusic();
  return (
    <main className={styles.page}>
      <article className={styles.card}>
        <h1 className={styles.name}>{fields.person_1_name}</h1>
        {event.date ? <p className={styles.line}>{event.date.full}</p> : null}
        {event.time ? <p className={styles.line}>{event.time}</p> : null}
        {fields.venue_name ? <p className={styles.line}>{fields.venue_name}</p> : null}
        {music.available ? (
          <button type="button" className={styles.music} onClick={music.toggle} aria-pressed={music.playing}>
            {music.playing ? labels.musicPause : labels.musicPlay}
          </button>
        ) : null}
        <GuestFormSlot render={(form) => <Rsvp form={form} labels={labels} />} />
      </article>
    </main>
  );
}

function Rsvp({ form, labels }: { form: Parameters<Parameters<typeof GuestFormSlot>[0]['render']>[0]; labels: ThemeProps['labels'] }) {
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  const [name, setName] = useState('');
  if (form.status === 'sent') return <p role="status">{form.isPreview ? labels.sentPreview : labels.sent}</p>;
  return (
    <div className={styles.rsvp}>
      <input aria-label={labels.guestName} placeholder={labels.guestName} value={name} onChange={(e) => setName(e.target.value)} />
      {form.fieldErrors.name ? <small>{form.fieldErrors.name}</small> : null}
      <div className={styles.row}>
        <button type="button" aria-pressed={attendance === 'ATTENDING'} onClick={() => setAttendance('ATTENDING')}>
          {labels.attending}
        </button>
        <button type="button" aria-pressed={attendance === 'NOT_ATTENDING'} onClick={() => setAttendance('NOT_ATTENDING')}>
          {labels.notAttending}
        </button>
      </div>
      {form.fieldErrors.attendance ? <small>{form.fieldErrors.attendance}</small> : null}
      <button type="button" onClick={() => form.submit({ name, attendance })} disabled={form.status === 'sending'}>
        {form.status === 'sending' ? labels.sending : labels.submit}
      </button>
    </div>
  );
}

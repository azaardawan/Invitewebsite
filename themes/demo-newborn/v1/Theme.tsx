'use client';

import { useState } from 'react';
import { GuestFormSlot, useMusic, type GuestAttendance, type ThemeProps } from '@/theme-sdk';
import styles from './theme.module.css';

/** Soft newborn announcement: boy or girl colours, the name, date of birth, parents and a short quote. */
export default function DemoNewbornTheme({ fields, labels, birthDate }: ThemeProps) {
  const music = useMusic();
  const girl = fields.baby_gender === 'girl';
  return (
    <main className={`${styles.page} ${girl ? styles.girl : styles.boy}`}>
      <article className={styles.card}>
        {fields.baby_gender ? <p className={styles.kicker}>{girl ? labels.itsAGirl : labels.itsABoy}</p> : null}
        <h1 className={styles.name}>{fields.baby_name}</h1>
        {birthDate ? (
          <p className={styles.line}>
            <small>{labels.bornOn}</small>
            <br />
            {birthDate.full}
          </p>
        ) : null}
        {fields.mother_name || fields.father_name ? (
          <p className={styles.parents}>{[fields.mother_name, fields.father_name].filter(Boolean).join(` ${labels.and} `)}</p>
        ) : null}
        {fields.baby_quote ? <p className={styles.quote}>{fields.baby_quote}</p> : null}
        {music.available ? (
          <button type="button" className={styles.button} onClick={music.toggle} aria-pressed={music.playing}>
            {music.playing ? labels.musicPause : labels.musicPlay}
          </button>
        ) : null}
        <GuestFormSlot render={(form) => <Wishes form={form} labels={labels} />} />
      </article>
    </main>
  );
}

function Wishes({ form, labels }: { form: Parameters<Parameters<typeof GuestFormSlot>[0]['render']>[0]; labels: ThemeProps['labels'] }) {
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  if (form.status === 'sent') return <p role="status">{form.isPreview ? labels.sentPreview : labels.sent}</p>;
  return (
    <div className={styles.form}>
      <h2>{labels.guestFormTitle}</h2>
      <input aria-label={labels.guestName} placeholder={labels.guestName} value={name} onChange={(e) => setName(e.target.value)} />
      {form.fieldErrors.name ? <small>{form.fieldErrors.name}</small> : null}
      <div className={styles.row}>
        <button type="button" className={styles.button} aria-pressed={attendance === 'ATTENDING'} onClick={() => setAttendance('ATTENDING')}>
          {labels.attending}
        </button>
        <button type="button" className={styles.button} aria-pressed={attendance === 'NOT_ATTENDING'} onClick={() => setAttendance('NOT_ATTENDING')}>
          {labels.notAttending}
        </button>
      </div>
      {form.fieldErrors.attendance ? <small>{form.fieldErrors.attendance}</small> : null}
      {form.withMessage ? <textarea aria-label={labels.message} placeholder={labels.message} value={message} onChange={(e) => setMessage(e.target.value)} rows={3} /> : null}
      <button type="button" className={styles.button} onClick={() => form.submit({ name, attendance, message })} disabled={form.status === 'sending'}>
        {form.status === 'sending' ? labels.sending : labels.submit}
      </button>
    </div>
  );
}

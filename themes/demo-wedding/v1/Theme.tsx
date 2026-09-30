'use client';

import '@fontsource-variable/noto-sans-arabic';
import { useState } from 'react';
import {
  GuestFormSlot,
  formatNumber,
  hasFeature,
  useCountdown,
  useMusic,
  useReducedMotion,
  type GuestAttendance,
  type ThemeProps,
} from '@/theme-sdk';
import styles from './theme.module.css';

/**
 * Internal demo theme: a closed card that opens on tap (starting the music),
 * then reveals the invitation. It exists to exercise the whole Theme Contract.
 */
export default function DemoWeddingTheme(props: ThemeProps) {
  const { fields, labels, event } = props;
  const music = useMusic();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  const openInvitation = () => {
    setOpen(true);
    music.start();
  };

  const initials = [fields.person_1_name, fields.person_2_name]
    .filter(Boolean)
    .map((n) => n!.trim().charAt(0))
    .join(' · ');

  return (
    <main className={styles.root} data-open={open} data-reduced={reduced}>
      {!open ? (
        <section className={styles.cover} aria-labelledby="demo-cover-title">
          <p className={styles.monogram} aria-hidden>
            {initials}
          </p>
          <h1 id="demo-cover-title" className={styles.coverTitle}>
            {fields.person_1_name}
            {fields.person_2_name ? <span className={styles.amp}> &amp; </span> : null}
            {fields.person_2_name}
          </h1>
          <button type="button" className={styles.openButton} onClick={openInvitation}>
            {labels.openInvitation}
          </button>
        </section>
      ) : (
        <div className={styles.content}>
          <header className={styles.names}>
            <h1>
              <span>{fields.person_1_name}</span>
              {fields.person_2_name ? (
                <>
                  <span className={styles.amp} aria-hidden>
                    &amp;
                  </span>
                  <span>{fields.person_2_name}</span>
                </>
              ) : null}
            </h1>
            {fields.family_names ? <p className={styles.families}>{fields.family_names}</p> : null}
          </header>

          {fields.invitation_message ? <p className={styles.message}>{fields.invitation_message}</p> : null}

          <dl className={styles.details}>
            {event.date ? (
              <div>
                <dt>{labels.date}</dt>
                <dd>{event.date.full}</dd>
              </div>
            ) : null}
            {event.time ? (
              <div>
                <dt>{labels.time}</dt>
                <dd>{event.time}</dd>
              </div>
            ) : null}
            {fields.venue_name ? (
              <div>
                <dt>{labels.venue}</dt>
                <dd>{fields.venue_name}</dd>
              </div>
            ) : null}
          </dl>

          {hasFeature(props, 'map') && props.mapUrl ? (
            <a className={styles.mapButton} href={props.mapUrl} target="_blank" rel="noopener noreferrer">
              {labels.openMap}
            </a>
          ) : null}

          {hasFeature(props, 'countdown') ? <Countdown {...props} /> : null}

          <GuestFormSlot render={(form) => <GuestForm form={form} labels={labels} />} />
        </div>
      )}

      {music.available && open ? (
        <button
          type="button"
          className={styles.musicButton}
          onClick={music.toggle}
          aria-pressed={music.playing}
          aria-label={music.playing ? labels.musicPause : labels.musicPlay}
        >
          <span aria-hidden>{music.playing ? '❚❚' : '♪'}</span>
        </button>
      ) : null}
    </main>
  );
}

function Countdown({ event, labels, locale }: ThemeProps) {
  const c = useCountdown(event.startsAt);
  if (!c) return <div className={styles.countdown} aria-hidden />;
  if (c.started) return <p className={styles.countdownDone}>{labels.eventStarted}</p>;
  const units: [number, string][] = [
    [c.days, labels.countdownDays],
    [c.hours, labels.countdownHours],
    [c.minutes, labels.countdownMinutes],
    [c.seconds, labels.countdownSeconds],
  ];
  return (
    <div className={styles.countdown} role="timer">
      {units.map(([n, label]) => (
        <div key={label}>
          <span className={styles.countNumber}>{formatNumber(n, locale)}</span>
          <span className={styles.countLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function GuestForm({
  form,
  labels,
}: {
  form: Parameters<Parameters<typeof GuestFormSlot>[0]['render']>[0];
  labels: ThemeProps['labels'];
}) {
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  if (form.status === 'sent') {
    return (
      <p className={styles.formDone} role="status">
        {labels.sent}
        {form.isPreview ? <span className={styles.formNote}>{labels.sentPreview}</span> : null}
      </p>
    );
  }
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        form.submit({ name: String(data.get('name') ?? ''), attendance, message: String(data.get('message') ?? '') });
      }}
    >
      <h2>{labels.guestFormTitle}</h2>
      <label>
        <span>{labels.guestName}</span>
        <input name="name" maxLength={form.limits.name} autoComplete="name" aria-invalid={Boolean(form.fieldErrors.name)} />
        {form.fieldErrors.name ? <span className={styles.error}>{form.fieldErrors.name}</span> : null}
      </label>
      <fieldset>
        <legend>{labels.attendanceQuestion}</legend>
        <div className={styles.choices}>
          {(['ATTENDING', 'NOT_ATTENDING'] as const).map((value) => (
            <label key={value} className={styles.choice} data-selected={attendance === value}>
              <input type="radio" name="attendance" value={value} checked={attendance === value} onChange={() => setAttendance(value)} />
              {value === 'ATTENDING' ? labels.attending : labels.notAttending}
            </label>
          ))}
        </div>
        {form.fieldErrors.attendance ? <span className={styles.error}>{form.fieldErrors.attendance}</span> : null}
      </fieldset>
      {form.withMessage ? (
        <label>
          <span>{labels.message}</span>
          <textarea name="message" rows={3} maxLength={form.limits.message} aria-invalid={Boolean(form.fieldErrors.message)} />
          {form.fieldErrors.message ? <span className={styles.error}>{form.fieldErrors.message}</span> : null}
        </label>
      ) : null}
      {form.error ? (
        <p className={styles.error} role="alert">
          {form.error}
        </p>
      ) : null}
      <button type="submit" className={styles.submit} disabled={form.status === 'sending'}>
        {form.status === 'sending' ? labels.sending : labels.submit}
      </button>
    </form>
  );
}

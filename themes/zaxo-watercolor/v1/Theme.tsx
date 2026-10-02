'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  GuestFormSlot,
  formatNumber,
  hasFeature,
  useCountdown,
  useMusic,
  useReducedMotion,
  type GuestAttendance,
  type GuestFormApi,
  type ThemeProps,
} from '@/theme-sdk';
import couple from './assets/couple-holding-hands.webp';
import landmarkScene from './assets/landmark-scene.webp';
import styles from './theme.module.css';

/**
 * Zaxo Watercolor. Cover → tap "Open" (starts music) → the content mounts
 * beneath the cover and rises (700 ms after 300 ms) while the cover fades out
 * over it (450 ms); the landmark scene fades in. The couple scene enters once
 * when scrolled into view. Artwork never mirrors with RTL/LTR.
 */
export default function ZaxoWatercolorTheme(props: ThemeProps) {
  const { fields, labels, event } = props;
  const music = useMusic();
  const reduced = useReducedMotion();
  const [opened, setOpened] = useState(false);
  const [coverGone, setCoverGone] = useState(false);

  // Fallback in case the cover's animationend never fires (e.g. animations disabled).
  useEffect(() => {
    if (!opened || coverGone) return;
    const t = setTimeout(() => setCoverGone(true), 600);
    return () => clearTimeout(t);
  }, [opened, coverGone]);

  const openInvitation = () => {
    music.start();
    setOpened(true);
    if (reduced) setCoverGone(true);
  };

  const names = (
    <>
      <span>{fields.person_1_name}</span>
      {fields.person_1_name && fields.person_2_name ? (
        <>
          {' '}
          <span className={styles.amp}>{labels.and}</span>{' '}
        </>
      ) : null}
      <span>{fields.person_2_name}</span>
    </>
  );

  return (
    <main className={styles.root} data-reduced={reduced}>
      <div className={styles.card}>
        <div className={`${styles.side} ${styles.sideLeft}`} aria-hidden />
        <div className={`${styles.side} ${styles.sideRight}`} aria-hidden />

        {!coverGone ? (
          <section
            className={styles.cover}
            data-opening={opened}
            aria-labelledby="zaxo-cover-names"
            aria-hidden={opened || undefined}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) setCoverGone(true);
            }}
          >
            <div className={styles.seal} aria-hidden>
              <Diamond className={styles.sealDiamond} />
            </div>
            <h1 id="zaxo-cover-names" className={styles.coverNames}>
              {names}
            </h1>
            <Image
              className={styles.coverArt}
              src={landmarkScene}
              alt=""
              sizes="(max-width: 430px) 100vw, 430px"
              priority
              unoptimized
            />
            <button type="button" className={styles.primary} onClick={openInvitation} disabled={opened}>
              {labels.openInvitation}
            </button>
          </section>
        ) : null}

        {opened ? (
          <div className={styles.content} data-animate={!reduced}>
            {music.available ? (
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

            <header className={styles.heading}>
              <h1 className={styles.names}>{names}</h1>
              <Diamond className={styles.divider} />
              {fields.invitation_message ? <p className={styles.message}>{fields.invitation_message}</p> : null}
            </header>

            <Image
              className={styles.landmarks}
              src={landmarkScene}
              alt=""
              sizes="(max-width: 430px) 100vw, 430px"
              unoptimized
            />

            <Details {...props} />

            {hasFeature(props, 'countdown') && event.startsAt ? <Countdown {...props} /> : null}

            <CoupleScene reduced={reduced} />

            <GuestFormSlot render={(form) => <GuestForm form={form} labels={labels} />} />

            {props.guestbook ? (
              <section className={styles.guestbook} aria-labelledby="zaxo-guestbook">
                <h2 id="zaxo-guestbook">{labels.guestbookTitle}</h2>
                {props.guestbook.length === 0 ? (
                  <p className={styles.note}>{labels.guestbookEmpty}</p>
                ) : (
                  <ul className={styles.guestbookList}>
                    {props.guestbook.map((m, i) => (
                      <li key={i} className={styles.guestbookItem}>
                        <p dir="auto">{m.message}</p>
                        <p className={styles.guestbookName} dir="auto">
                          — {m.guestName}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}

            <footer className={styles.ending}>
              <Diamond className={styles.divider} />
            </footer>
          </div>
        ) : null}
      </div>
    </main>
  );
}

/** The heritage diamond ornament (vector, decorative). */
function Diamond({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden focusable="false">
      <path fill="#a45436" d="M32 2 62 32 32 62 2 32z" />
      <path fill="#bf9555" d="M32 11 53 32 32 53 11 32z" />
      <path fill="#fbf2e2" d="M32 19 45 32 32 45 19 32z" />
      <path fill="#2c6465" d="M32 25 39 32 32 39 25 32z" />
    </svg>
  );
}

function Details(props: ThemeProps) {
  const { event, fields, labels, mapUrl } = props;
  const hasWhen = Boolean(event.date || event.time);
  const hasWhere = Boolean(fields.venue_name);
  const showMap = hasFeature(props, 'map') && mapUrl;
  if (!hasWhen && !hasWhere) return null;
  return (
    <section className={styles.details}>
      {hasWhen ? (
        <div>
          <p className={styles.caption}>{event.date ? labels.date : labels.time}</p>
          {event.date ? <p className={styles.detailValue}>{event.date.full}</p> : null}
          {event.time ? <p>{event.time}</p> : null}
        </div>
      ) : null}
      {hasWhen && hasWhere ? <Diamond className={styles.smallDivider} /> : null}
      {hasWhere ? (
        <div>
          <p className={styles.caption}>{labels.venue}</p>
          <p className={styles.detailValue}>{fields.venue_name}</p>
          {showMap ? (
            <a className={styles.outline} href={mapUrl} target="_blank" rel="noopener noreferrer">
              {labels.openMap}
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Countdown({ event, labels, locale }: ThemeProps) {
  const c = useCountdown(event.startsAt);
  // Reserve the row's height until the shared clock has ticked once (no layout jump).
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
        <span key={label} className={styles.countUnit}>
          <b>{formatNumber(n, locale)}</b>
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}

/** Static theme artwork (not a customer photo). Fades in and rises 20px once, on first visibility. */
function CoupleScene({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (reduced || !el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <figure ref={ref} className={styles.coupleScene} data-pending={!reduced && !shown}>
      <Image src={couple} alt="" sizes="290px" unoptimized />
    </figure>
  );
}

function GuestForm({ form, labels }: { form: GuestFormApi; labels: ThemeProps['labels'] }) {
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  const sending = form.status === 'sending';

  if (form.status === 'sent') {
    return (
      <section className={styles.rsvp}>
        <div className={styles.success} role="status">
          <Diamond className={styles.successDiamond} />
          <p>{labels.sent}</p>
          {form.isPreview ? <p className={styles.note}>{labels.sentPreview}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.rsvp}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          form.submit({ name: String(data.get('name') ?? ''), attendance, message: String(data.get('message') ?? '') });
        }}
      >
        <h2>{labels.guestFormTitle}</h2>
        <label className={styles.field}>
          <span>{labels.guestName}</span>
          <input
            name="name"
            maxLength={form.limits.name}
            autoComplete="name"
            disabled={sending}
            aria-invalid={Boolean(form.fieldErrors.name)}
          />
          {form.fieldErrors.name ? <span className={styles.error}>{form.fieldErrors.name}</span> : null}
        </label>
        <fieldset className={styles.fieldset} disabled={sending}>
          <legend>{labels.attendanceQuestion}</legend>
          {(['ATTENDING', 'NOT_ATTENDING'] as const).map((value) => (
            <label key={value} className={styles.choice}>
              <input type="radio" name="attendance" value={value} checked={attendance === value} onChange={() => setAttendance(value)} />
              <span>{value === 'ATTENDING' ? labels.attending : labels.notAttending}</span>
            </label>
          ))}
          {form.fieldErrors.attendance ? <span className={styles.error}>{form.fieldErrors.attendance}</span> : null}
        </fieldset>
        {form.withMessage ? (
          <label className={styles.field}>
            <span>{labels.message}</span>
            <textarea
              name="message"
              rows={3}
              maxLength={form.limits.message}
              disabled={sending}
              aria-invalid={Boolean(form.fieldErrors.message)}
            />
            {form.fieldErrors.message ? <span className={styles.error}>{form.fieldErrors.message}</span> : null}
          </label>
        ) : null}
        {form.error ? (
          <p className={styles.error} role="alert">
            {form.error}
          </p>
        ) : null}
        <button type="submit" className={`${styles.primary} ${styles.submit}`} disabled={sending}>
          {sending ? labels.sending : labels.submit}
        </button>
      </form>
    </section>
  );
}

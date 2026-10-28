'use client';

import { useEffect, useState } from 'react';
import { GuestFormSlot, ThemeBorder, hasFeature, useMusic, useReducedMotion, type GuestAttendance, type GuestFormApi, type ThemeLabels, type ThemeProps } from '@/theme-sdk';
import { BORDER } from './border';
import { CoverArt } from './cover';
import { Lettering, StoryDesign, designData, fitLettering } from './designs';
import s from './invitation.module.css';

/** closed (the cover) → opening (the artwork parts, the invitation settles) → open. */
type Phase = 'closed' | 'opening' | 'open';
/** The opening's length (the CSS keyframes end by then); with reduced motion the cover only fades. */
const OPENING_MS = 2700;
const FADE_MS = 350;

/**
 * Swan Garden: the online invitation (owner, 2026-10-28: newborn designs get one too). A cover built from the
 * design's own artwork with the baby's name and the open button; tapping it starts the music while the artwork
 * parts and the design's invitation (the story composition) settles in. Below: the date of birth, the guest form
 * with congratulations, the guests' messages and a closing with the name, all in the design's fonts and colours.
 * No venue, time, map or countdown: a birth has no event to travel to.
 */
export default function SwanGardenTheme(props: ThemeProps) {
  const { labels, dir, lang, birthDate } = props;
  const reduced = useReducedMotion();
  const music = useMusic();
  const [phase, setPhase] = useState<Phase>('closed');
  const d = designData(props);

  useEffect(() => {
    if (phase !== 'opening') return;
    const t = window.setTimeout(() => setPhase('open'), reduced ? FADE_MS : OPENING_MS);
    return () => window.clearTimeout(t);
  }, [phase, reduced]);

  const open = () => {
    if (phase !== 'closed') return;
    music.start();
    setPhase('opening');
  };

  const closed = phase === 'closed';
  const withMusic = hasFeature(props, 'music') && music.available;
  return (
    <div className={s.page} data-phase={phase} data-reduced={reduced ? '' : undefined} dir={dir} lang={lang}>
      {phase !== 'open' ? (
        <section className={s.cover} aria-label={d.name || labels.openInvitation}>
          <CoverArt />
          <div className={s.coverText}>
            {d.name ? (
              <div className={s.coverName}>
                <Lettering text={d.name} size={fitLettering(d.name, 92, '26cqw')} dir={dir} />
              </div>
            ) : null}
            {d.birthLines?.length ? (
              <p className={s.coverDate} dir="auto">
                {d.birthLines.join(' · ')}
              </p>
            ) : null}
            <button type="button" className={s.openButton} onClick={open} disabled={!closed}>
              {labels.openInvitation}
            </button>
          </div>
        </section>
      ) : null}

      <div className={s.content} hidden={closed} inert={closed}>
        <div className={s.storyBox}>
          <StoryDesign d={d} variant="story" />
        </div>

        <div className={s.sheet}>
          <ThemeBorder border={props.border} fallback={BORDER} medium="screen" />

          {birthDate ? (
            <section className={s.section} aria-label={labels.bornOn}>
              <p className={s.eyebrow}>{labels.bornOn}</p>
              <div className={s.dateCard}>
                <span className={s.dateSide}>{birthDate.weekday}</span>
                <span className={s.dateDay}>{birthDate.day}</span>
                <span className={s.dateSide}>
                  {birthDate.month}
                  <br />
                  {birthDate.year}
                </span>
              </div>
            </section>
          ) : null}

          <GuestFormSlot
            render={(form) => (
              <section className={s.section}>
                <h2 className={s.heading}>{labels.guestFormTitle}</h2>
                <GuestForm form={form} labels={labels} />
              </section>
            )}
          />

          {props.guestbook ? (
            <section className={s.section}>
              <h2 className={s.heading}>{labels.guestbookTitle}</h2>
              {props.guestbook.length ? (
                <ul className={s.messages}>
                  {props.guestbook.map((m, i) => (
                    <li key={i} className={s.message}>
                      <p dir="auto">{m.message}</p>
                      <p className={s.from} dir="auto">
                        — {m.guestName}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={s.muted}>{labels.guestbookEmpty}</p>
              )}
            </section>
          ) : null}

          <footer className={s.closing}>
            {d.name ? (
              <div className={s.closingName}>
                <Lettering text={d.name} size={fitLettering(d.name, 80, '18cqw')} dir={dir} />
              </div>
            ) : null}
            {withMusic ? (
              <button type="button" className={s.textButton} onClick={music.toggle} aria-pressed={music.playing}>
                {music.playing ? labels.musicPause : labels.musicPlay}
              </button>
            ) : null}
          </footer>
        </div>
      </div>

      {withMusic && phase === 'open' ? (
        <button type="button" className={s.musicFab} onClick={music.toggle} aria-pressed={music.playing} aria-label={music.playing ? labels.musicPause : labels.musicPlay}>
          <span aria-hidden="true">{music.playing ? '❚❚' : '♪'}</span>
        </button>
      ) : null}
    </div>
  );
}

/** The guest form in the design's style; the platform validates, stores and adds "how many of you". */
function GuestForm({ form, labels }: { form: GuestFormApi; labels: ThemeLabels }) {
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  if (form.status === 'sent') {
    return (
      <p role="status" className={s.sent}>
        {form.isPreview ? labels.sentPreview : labels.sent}
      </p>
    );
  }
  return (
    <form
      className={s.form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        void form.submit({ name: String(data.get('name') ?? ''), attendance, message: String(data.get('message') ?? '') });
      }}
    >
      <label className={s.field}>
        <span>{labels.guestName}</span>
        <input name="name" maxLength={form.limits.name} autoComplete="name" aria-invalid={Boolean(form.fieldErrors.name)} />
        {form.fieldErrors.name ? <span className={s.error}>{form.fieldErrors.name}</span> : null}
      </label>
      <fieldset className={s.choices}>
        <legend>{labels.attendanceQuestion}</legend>
        {(['ATTENDING', 'NOT_ATTENDING'] as const).map((value) => (
          <label key={value} className={s.choice}>
            <input type="radio" name="attendance" value={value} checked={attendance === value} onChange={() => setAttendance(value)} />
            <span>{value === 'ATTENDING' ? labels.attending : labels.notAttending}</span>
          </label>
        ))}
        {form.fieldErrors.attendance ? <span className={s.error}>{form.fieldErrors.attendance}</span> : null}
      </fieldset>
      {form.withMessage ? (
        <label className={s.field}>
          <span>{labels.message}</span>
          <textarea name="message" rows={4} maxLength={form.limits.message} aria-invalid={Boolean(form.fieldErrors.message)} />
          {form.fieldErrors.message ? <span className={s.error}>{form.fieldErrors.message}</span> : null}
        </label>
      ) : null}
      {form.error ? (
        <p role="alert" className={s.error}>
          {form.error}
        </p>
      ) : null}
      <button type="submit" className={s.submit} disabled={form.status === 'sending'}>
        {form.status === 'sending' ? labels.sending : labels.submit}
      </button>
    </form>
  );
}

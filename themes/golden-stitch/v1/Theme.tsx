"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  GuestFormSlot,
  ThemeBorder,
  formatNumber,
  hasFeature,
  useCountdown,
  useMusic,
  useReducedMotion,
  type GuestAttendance,
  type GuestFormApi,
  type ThemeLabels,
  type ThemeProps,
} from "@/theme-sdk";
import { STITCH_BORDER } from "./border";
import { copyFor, type Copy } from "./copy";
import { Frame } from "./Frame";
import { Divider } from "./Divider";
import filmPoster from "./assets/film-poster.webp";
import heartSketch from "./assets/heart-sketch.webp";
import laurelLeft from "./assets/laurel-left.webp";
import laurelRight from "./assets/laurel-right.webp";
import countBox from "./assets/count-box.svg";
import rings from "./assets/rings.webp";
import sprigPair from "./assets/sprig-pair.webp";
import fonts from "./fonts.module.css";
import s from "./theme.module.css";

/** The sample film (sample names) shown in the storefront and before payment; each couple gets their own after paying. */
const SAMPLE_FILM = new URL("./assets/sample-film.mp4", import.meta.url).href;

/**
 * The invitation opens on its own straight into the film (owner, 2026-11-25: no Open button for this design): the
 * needle stitches the date and the heart, then the pages appear. Browsers only start a video by itself without sound,
 * so it plays muted with a "sound" button (a tap anywhere on the film works too) unless the browser allows sound.
 * Without a film (not made yet, a phone that can't play it) or with reduced motion: straight to the pages.
 */
type Stage = "film" | "pages";

const noop = () => () => {};

export default function GoldenStitch(props: ThemeProps) {
  const {
    mode,
    locale,
    dir,
    lang,
    fields,
    labels,
    event,
    mapUrl,
    wording,
    switches,
  } = props;
  const t = copyFor(locale);
  const reduced = useReducedMotion();
  const music = useMusic();
  // The couple's own film is made after payment (manifest `film`, about ten minutes); until it is ready the invitation
  // shows its pages. Samples and previews show the sample film.
  const film = mode === "live" ? (props.film?.src ?? null) : SAMPLE_FILM;
  const [stage, setStage] = useState<Stage>(film ? "film" : "pages");
  const [muted, setMuted] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  const startMusic = music.start;
  const toPages = useCallback(() => {
    video.current?.pause();
    setStage("pages");
    startMusic();
  }, [startMusic]);

  // Start the film as soon as the page is ready: with sound when the browser allows it, otherwise muted.
  useEffect(() => {
    if (stage !== "film") return;
    const v = video.current;
    // (Read directly: on the first render after the server's, `useReducedMotion` can still say "no".)
    if (
      reduced ||
      !v ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setStage("pages");
      return;
    }
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      v.play().catch(() => setStage("pages"));
    });
    // Runs once, when the page first shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The invitation always begins at its first page (the families), wherever the page was when the film ended.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [stage]);

  // The guest's tap turns the needle's sound on, and lets the song start when the pages appear.
  // Handled on click, not pointerdown: a touch only counts as the guest's permission for sound once it ends, and a
  // browser that is refused sound pauses the film. If it still refuses, the film carries on silently.
  const soundOn = () => {
    const v = video.current;
    music.prime();
    if (!v || !v.muted) return;
    v.muted = false;
    setMuted(false);
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      void v.play().catch(() => toPages());
    });
  };

  // Never stuck on the film: the pages come at the latest a few seconds after it should have ended.
  useEffect(() => {
    if (stage !== "film") return;
    const id = window.setTimeout(toPages, 25_000);
    return () => window.clearTimeout(id);
  }, [stage, toPages]);

  // A browser that kept the film muted plays the song from the guest's first tap on the pages.
  const heard = useRef(false);
  useEffect(() => {
    if (stage !== "pages" || !music.available) return;
    const first = (e: PointerEvent) => {
      if (
        heard.current ||
        (e.target as Element | null)?.closest("[data-gs-audio]")
      )
        return;
      heard.current = true;
      if (!music.playing) startMusic();
    };
    document.addEventListener("pointerdown", first);
    return () => document.removeEventListener("pointerdown", first);
  }, [stage, music.available, music.playing, startMusic]);

  const showCountdown =
    hasFeature(props, "countdown") && event.startsAt !== null;
  const showMap = hasFeature(props, "map") && mapUrl !== null;
  const showVerse = switches.showVerse !== false;
  const hasFamilies = Boolean(fields.person_1_family || fields.person_2_family);
  const hasDetails = Boolean(
    event.date || event.time || fields.venue_name || showMap,
  );
  const hasMessages = hasFeature(props, "rsvp") || props.guestbook !== null;

  return (
    <div
      className={`${fonts.fonts} ${s.root}`}
      dir={dir}
      lang={lang}
      data-stage={stage}
    >
      {stage === "film" && film ? (
        <div className={s.film} onClick={soundOn}>
          <video
            ref={video}
            className={s.filmVideo}
            src={film}
            poster={filmPoster.src}
            playsInline
            preload="auto"
            onEnded={toPages}
            onError={() => setStage("pages")}
          />
          {muted ? (
            <button
              type="button"
              className={s.sound}
              onClick={(e) => {
                e.stopPropagation();
                soundOn();
              }}
            >
              <SpeakerIcon on={false} />
              <span>{t.soundOn}</span>
            </button>
          ) : null}
          <button
            type="button"
            className={s.skip}
            onClick={(e) => {
              e.stopPropagation();
              toPages();
            }}
          >
            {t.skipFilm}
          </button>
        </div>
      ) : null}
      {/* Without JavaScript the film can't play; show the pages instead. */}
      <noscript>
        <style>{`.${s.film}{display:none!important}`}</style>
      </noscript>

      {music.available && stage === "pages" && (
        <button
          type="button"
          className={s.audio}
          data-gs-audio=""
          onClick={() => {
            heard.current = true;
            music.toggle();
          }}
          aria-pressed={music.playing}
          aria-label={music.playing ? labels.musicPause : labels.musicPlay}
          title={music.playing ? labels.musicPause : labels.musicPlay}
        >
          <SpeakerIcon on={music.playing} />
        </button>
      )}

      <main
        className={s.pages}
        inert={hydrated && stage !== "pages" ? true : undefined}
      >
        {/* 1 · The families invite you to the wedding of the couple. */}
        <section className={s.sheet}>
          <ThemeBorder
            border={props.border}
            fallback={STITCH_BORDER}
            medium="screen"
          />
          <Frame skipBorderCorners />
          <div className={s.sheetInner}>
            {hasFamilies ? (
              <>
                <p className={s.caps}>{t.togetherWith}</p>
                <Divider />
                {fields.person_1_family ? (
                  <div className={s.family}>
                    <p className={s.italic}>{t.groomFamily}</p>
                    <p className={s.familyName}>{fields.person_1_family}</p>
                  </div>
                ) : null}
                {fields.person_1_family && fields.person_2_family ? (
                  <p className={s.amp} aria-hidden="true">
                    <span className={s.ampRule} />
                    <span>{labels.and}</span>
                    <span className={s.ampRule} />
                  </p>
                ) : null}
                {fields.person_2_family ? (
                  <div className={s.family}>
                    <p className={s.italic}>{t.brideFamily}</p>
                    <p className={s.familyName}>{fields.person_2_family}</p>
                  </div>
                ) : null}
              </>
            ) : null}
            <p className={`${s.caps} ${s.request}`}>{t.request}</p>
            <h1 className={s.names}>
              <Names fields={fields} labels={labels} />
            </h1>
            <Divider />
          </div>
        </section>

        {/* 2 · The Quran verse (Ar-Rum 21), unless the customer switched it off. */}
        {showVerse ? (
          <section className={s.sheet}>
            <Frame />
            <div className={s.sheetInner}>
              <Divider />
              <h2 className={`${s.caps} ${s.wide}`}>{t.verseTitle}</h2>
              <p className={s.verse} lang="ar" dir="rtl">
                <span className={s.verseMark} aria-hidden="true">
                  ﴿
                </span>
                {t.verse}
                <span className={s.verseMark} aria-hidden="true">
                  ﴾
                </span>
              </p>
              {t.verseTranslation ? (
                <p className={s.verseTranslation}>{t.verseTranslation}</p>
              ) : null}
              <Divider small />
              <p className={`${s.capsSmall} ${s.wide}`}>{t.verseRef}</p>
            </div>
          </section>
        ) : null}

        {/* 3 · The couple's personal note. */}
        {fields.invitation_message ? (
          <section className={s.sheet}>
            <Frame />
            <div className={s.sheetInner}>
              <h2 className={`${s.caps} ${s.wide}`}>{t.noteTitle}</h2>
              <Divider />
              {wording.noteGreeting ? (
                <p className={s.greeting}>{wording.noteGreeting}</p>
              ) : null}
              <p className={s.note}>{fields.invitation_message}</p>
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative artwork */}
              <img
                className={s.sprigPair}
                src={sprigPair.src}
                alt=""
                aria-hidden="true"
              />
              <Divider />
            </div>
          </section>
        ) : null}

        {/* 4 · Date, time and venue, with the map button. */}
        {hasDetails ? (
          <section className={s.sheet}>
            <Frame />
            <div className={s.sheetInner}>
              <h2 className={`${s.caps} ${s.wide}`}>{t.detailsTitle}</h2>
              <Divider />
              <dl className={s.details}>
                {event.date ? (
                  <div className={s.detail}>
                    <CalendarIcon />
                    <dt className={s.capsSmall}>{labels.date}</dt>
                    <dd className={s.detailValue}>{event.date.full}</dd>
                  </div>
                ) : null}
                {event.time ? (
                  <div className={s.detail}>
                    <ClockIcon />
                    <dt className={s.capsSmall}>{labels.time}</dt>
                    <dd className={s.detailValue}>{event.time}</dd>
                  </div>
                ) : null}
                {fields.venue_name ? (
                  <div className={s.detail}>
                    <PinIcon />
                    <dt className={s.capsSmall}>{labels.venue}</dt>
                    <dd className={s.detailValue}>{fields.venue_name}</dd>
                  </div>
                ) : null}
              </dl>
              {showMap ? (
                <a
                  className={s.mapButton}
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapIcon />
                  <span className={s.mapRule} aria-hidden="true" />
                  <span>{labels.openMap}</span>
                  <ArrowIcon dir={dir} />
                </a>
              ) : null}
              <Divider />
            </div>
          </section>
        ) : null}

        {/* 5 · Countdown to the wedding. */}
        {showCountdown ? (
          <section className={s.sheet}>
            <Frame />
            <div className={s.sheetInner}>
              <h2 className={s.countdownTitle}>
                <span className={s.countdownBig}>{t.countdownTitle}</span>
                <span className={`${s.caps} ${s.wide}`}>{t.countdownSub}</span>
              </h2>
              <Divider />
              <Countdown
                startsAt={event.startsAt}
                labels={labels}
                locale={locale}
              />
              <Divider />
              <p className={s.specialDay}>
                {/* eslint-disable @next/next/no-img-element -- decorative artwork */}
                <img
                  className={s.laurel}
                  src={laurelLeft.src}
                  alt=""
                  aria-hidden="true"
                />
                <span dir={dir}>{t.untilSpecialDay}</span>
                <img
                  className={s.laurel}
                  src={laurelRight.src}
                  alt=""
                  aria-hidden="true"
                />
                {/* eslint-enable @next/next/no-img-element */}
              </p>
            </div>
          </section>
        ) : null}

        {/* 6 · Congratulations: the guest form (name, coming or not, message) and the messages shown under it. */}
        {hasMessages ? (
          <section className={s.sheet}>
            <Frame />
            <div className={s.sheetInner}>
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative artwork */}
              <img
                className={s.rings}
                src={rings.src}
                alt=""
                aria-hidden="true"
              />
              <h2 className={`${s.caps} ${s.wide} ${s.congratsTitle}`}>
                {t.congratsTitle}
              </h2>
              <Divider />
              <p className={s.italicMedium}>{t.congratsIntro}</p>
              <GuestFormSlot
                render={(api) => (
                  <GuestForm api={api} t={t} labels={labels} locale={locale} />
                )}
              />
              {props.guestbook ? (
                props.guestbook.length === 0 ? (
                  <p className={s.guestbookEmpty}>{labels.guestbookEmpty}</p>
                ) : (
                  <ul
                    className={s.guestbook}
                    aria-label={labels.guestbookTitle}
                  >
                    {props.guestbook.map((m, i) => (
                      <li key={i} className={s.wish}>
                        <UserIcon />
                        <span className={s.wishRule} aria-hidden="true" />
                        <div className={s.wishText}>
                          <p className={s.wishName} dir="auto">
                            {m.guestName}
                          </p>
                          <p className={s.wishMessage} dir="auto">
                            {m.message}
                          </p>
                        </div>
                        <HeartIcon />
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
              <Divider />
            </div>
          </section>
        ) : null}

        {/* 7 · Thank you. */}
        <section className={s.sheet}>
          <Frame />
          <div className={`${s.sheetInner} ${s.thanksInner}`}>
            <Divider />
            <p className={s.thanks}>{t.thanks}</p>
            <Divider />
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative artwork */}
            <img
              className={s.heart}
              src={heartSketch.src}
              alt=""
              aria-hidden="true"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function Names({
  fields,
  labels,
}: {
  fields: ThemeProps["fields"];
  labels: ThemeLabels;
}) {
  return (
    <>
      {fields.person_1_name ? (
        <span className={s.name}>{fields.person_1_name}</span>
      ) : null}
      {fields.person_1_name && fields.person_2_name ? (
        <span className={s.and}> {labels.and} </span>
      ) : null}
      {fields.person_2_name ? (
        <span className={s.name}>{fields.person_2_name}</span>
      ) : null}
    </>
  );
}

function Countdown({
  startsAt,
  labels,
  locale,
}: {
  startsAt: string | null;
  labels: ThemeLabels;
  locale: ThemeProps["locale"];
}) {
  const left = useCountdown(startsAt);
  if (left?.started)
    return <p className={s.italicLarge}>{labels.eventStarted}</p>;
  const pad = (n: number | null) =>
    n === null
      ? "–"
      : formatNumber(n, locale).padStart(2, formatNumber(0, locale));
  const units: [number | null, string][] = [
    [left?.days ?? null, labels.countdownDays],
    [left?.hours ?? null, labels.countdownHours],
    [left?.minutes ?? null, labels.countdownMinutes],
    [left?.seconds ?? null, labels.countdownSeconds],
  ];
  return (
    <div className={s.countdown} role="timer" aria-live="off">
      {units.map(([n, label]) => (
        <div
          key={label}
          className={s.unit}
          style={{ backgroundImage: `url(${countBox.src})` }}
        >
          <span className={s.unitValue}>{pad(n)}</span>
          <span className={s.unitLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function GuestForm({
  api,
  t,
  labels,
  locale,
}: {
  api: GuestFormApi;
  t: Copy;
  labels: ThemeLabels;
  locale: ThemeProps["locale"];
}) {
  const [name, setName] = useState("");
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  const [message, setMessage] = useState("");

  if (api.status === "sent") {
    return (
      <div className={s.box} role="status">
        <p className={s.sentTitle}>{labels.sent}</p>
        {api.isPreview && <p className={s.sentBody}>{labels.sentPreview}</p>}
      </div>
    );
  }
  const sending = api.status === "sending";
  const e = api.fieldErrors;
  const left = api.limits.message - message.length;

  return (
    <form
      className={s.box}
      onSubmit={(ev) => {
        ev.preventDefault();
        void api.submit({ name, attendance, message });
      }}
      noValidate
      aria-busy={sending}
    >
      <h3 className={s.srOnly}>{labels.guestFormTitle}</h3>
      <div className={s.field} data-invalid={e.name ? "" : undefined}>
        <label className={s.label} htmlFor="gs-guest-name">
          {labels.guestName}
        </label>
        <input
          id="gs-guest-name"
          className={s.input}
          name="name"
          autoComplete="name"
          value={name}
          maxLength={api.limits.name}
          onChange={(ev) => setName(ev.target.value)}
          disabled={sending}
          aria-invalid={e.name ? true : undefined}
          aria-describedby={e.name ? "gs-guest-name-error" : undefined}
        />
        {e.name && <FieldError id="gs-guest-name-error">{e.name}</FieldError>}
      </div>

      <fieldset
        className={s.field}
        data-invalid={e.attendance ? "" : undefined}
        aria-describedby={e.attendance ? "gs-attending-error" : undefined}
        disabled={sending}
      >
        <legend className={s.label}>{labels.attendanceQuestion}</legend>
        <div className={s.choices}>
          {(["ATTENDING", "NOT_ATTENDING"] as const).map((value) => (
            <label
              key={value}
              className={s.choice}
              data-checked={attendance === value ? "" : undefined}
            >
              <input
                type="radio"
                name="attendance"
                className={s.choiceInput}
                checked={attendance === value}
                onChange={() => setAttendance(value)}
              />
              <span className={s.choiceDot} aria-hidden="true" />
              <span>
                {value === "ATTENDING" ? labels.attending : labels.notAttending}
              </span>
            </label>
          ))}
        </div>
        {e.attendance && (
          <FieldError id="gs-attending-error">{e.attendance}</FieldError>
        )}
      </fieldset>

      {api.withMessage && (
        <div
          className={`${s.field} ${s.messageField}`}
          data-invalid={e.message ? "" : undefined}
        >
          <PencilIcon />
          <textarea
            id="gs-message"
            aria-label={labels.message}
            className={`${s.input} ${s.textarea}`}
            name="message"
            rows={3}
            placeholder={t.messagePlaceholder}
            value={message}
            maxLength={api.limits.message}
            onChange={(ev) => setMessage(ev.target.value)}
            disabled={sending}
            aria-invalid={e.message ? true : undefined}
            aria-describedby={`gs-message-count${e.message ? " gs-message-error" : ""}`}
          />
          <div className={s.fieldFoot}>
            {e.message ? (
              <FieldError id="gs-message-error">{e.message}</FieldError>
            ) : (
              <span />
            )}
            <span
              id="gs-message-count"
              className={s.counter}
              data-over={left < 0 ? "" : undefined}
            >
              {formatNumber(left, locale)}
            </span>
          </div>
        </div>
      )}

      {api.error && (
        <p className={s.formError} role="alert">
          {api.error}
        </p>
      )}

      <button type="submit" className={s.submit} disabled={sending}>
        <span>{sending ? labels.sending : labels.submit}</span>
        <SendIcon />
      </button>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className={s.error} role="alert">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------- line icons (1.3 px), as the owner drew them

const icon = {
  viewBox: "0 0 24 24",
  width: 30,
  height: 30,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function CalendarIcon() {
  return (
    <svg {...icon} className={s.icon}>
      <rect x="3" y="5" width="18" height="15" rx="2.5" />
      <path d="M3 9.5h18M8 3v4M16 3v4" />
      <path
        d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01M16 16.5h.01"
        strokeWidth={2}
      />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg {...icon} className={s.icon}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.4 0" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg {...icon} className={s.icon}>
      <path d="M12 21.5s-6.8-6-6.8-11.3a6.8 6.8 0 0 1 13.6 0c0 5.3-6.8 11.3-6.8 11.3Z" />
      <circle cx="12" cy="10.2" r="2.4" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg {...icon} width={26} height={26}>
      <path d="M3.5 7.5 8.5 5.5l7 2 5-2v11l-5 2-7-2-5 2z" />
      <path d="M8.5 5.5v11M15.5 7.5v4" />
      <path
        d="M15.5 17.6s-2.8-2.5-2.8-4.6a2.8 2.8 0 0 1 5.6 0c0 2.1-2.8 4.6-2.8 4.6Z"
        fill="var(--gs-paper)"
      />
    </svg>
  );
}
function ArrowIcon({ dir }: { dir: "rtl" | "ltr" }) {
  return (
    <svg
      {...icon}
      width={20}
      height={20}
      style={dir === "rtl" ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M4 12h15M14 7l5 5-5 5" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg {...icon} width={24} height={24} className={s.pencil}>
      <path d="M15.5 4.5l4 4L9 19l-5 1 1-5z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg {...icon} width={22} height={22}>
      <path d="M20.5 3.5 3.5 10.6l7 2.9 2.9 7z" />
      <path d="M10.5 13.5l10-10" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg {...icon} width={28} height={28} className={s.wishIcon}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20.5c0-3.7 3.4-6.3 7.5-6.3s7.5 2.6 7.5 6.3z" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg {...icon} width={24} height={24} className={s.wishHeart}>
      <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
    </svg>
  );
}
function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg {...icon} width={24} height={24}>
      <path
        d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"
        fill="currentColor"
        fillOpacity={on ? 1 : 0.2}
      />
      {on ? (
        <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
      ) : (
        <path d="M16 9.5l5 5M21 9.5l-5 5" />
      )}
    </svg>
  );
}

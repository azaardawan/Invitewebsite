'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  EditableText,
  Gallery3D,
  Photo,
  PhotoSlot,
  ThemeBorder,
  VideoSlot,
  hasFeature,
  useReducedMotion,
  useTemplateEditing,
  useTouchScreen,
  type Gallery3DHandle,
  type ThemePhoto,
  type ThemeProps,
} from '@/theme-sdk';
import { FRAME_BORDER } from './border';
import { copyFor, type Copy } from './copy';
import { PER_ROOM, PLAN, ROOMS } from './plan';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/** closed (the doors and the placard) → opening (the doors swing in) → open (the museum). */
type Phase = 'closed' | 'opening' | 'open';
const OPENING_MS = 1550;
const REDUCED_MS = 380;
/** How long the walking hint stays (unless the guest starts walking). */
const HINT_MS = 7000;

const MODEL = new URL('./assets/museum.glb', import.meta.url).href;

const LOOK = {
  font: "'MM Display', 'Amiri', Georgia, serif",
  signInk: '#e2c27a',
  signGround: '#1d2a2a',
  screenInk: '#f1e9db',
  screenGround: '#14110d',
};

const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');

/** A photo's title and few words: the customer's, or the examples in samples. */
function words(p: ThemePhoto, props: ThemeProps, copy: Copy): { title: string | null; caption: string | null } {
  if (props.mode === 'sample') {
    const [title, caption] = copy.samples[p.index % copy.samples.length]!;
    return { title: p.title ?? title ?? null, caption: p.caption ?? caption ?? null };
  }
  return { title: p.title, caption: p.caption };
}

/** The room a photo place is in (0-based) and that room's name (the customer's, or "Room 2" when they cleared it). */
function roomOf(index: number) {
  return Math.floor(index / PER_ROOM);
}
function roomName(props: ThemeProps, copy: Copy, room: number) {
  return props.wording[ROOMS[room]!]?.trim() || `${copy.room} ${room + 1}`;
}

export default function MemoryMuseum(props: ThemeProps) {
  const editing = useTemplateEditing();
  const reduced = useReducedMotion();
  const copy = copyFor(props.locale);
  const [phase, setPhase] = useState<Phase>('closed');
  const [flat, setFlat] = useState(false);
  const shown: Phase = editing ? 'open' : phase;

  const open = () => {
    if (phase !== 'closed') return;
    setPhase('opening');
    window.setTimeout(() => setPhase('open'), reduced ? REDUCED_MS : OPENING_MS);
  };

  return (
    <div className={c(fonts.root, 'root', reduced && 'reduced')} dir={props.dir} lang={props.lang} data-phase={shown}>
      {editing || flat ? <FlatMuseum props={props} copy={copy} editing={editing} /> : <MuseumWalk props={props} copy={copy} reduced={reduced} active={shown === 'open'} onUnavailable={() => setFlat(true)} />}
      {shown !== 'open' ? <Cover props={props} copy={copy} phase={shown} onOpen={open} /> : null}
    </div>
  );
}

function Names({ props, className, as: Tag = 'h1' }: { props: ThemeProps; className: string; as?: 'h1' | 'p' }) {
  const { person_1_name: a, person_2_name: b } = props.fields;
  if (!a && !b) return null;
  return (
    <Tag className={c(className)}>
      {a}
      {a && b ? <span className={c('and')}>{props.labels.and}</span> : null}
      {b}
    </Tag>
  );
}

function Cover({ props, copy, phase, onOpen }: { props: ThemeProps; copy: Copy; phase: Phase; onOpen: () => void }) {
  return (
    <div className={c('cover')} data-phase={phase}>
      <div className={c('door', 'doorL')} aria-hidden>
        <span className={c('handle')} />
      </div>
      <div className={c('door', 'doorR')} aria-hidden>
        <span className={c('handle')} />
      </div>
      <div className={c('placard')}>
        <ThemeBorder border={props.border} fallback={FRAME_BORDER} medium="screen" />
        {props.wording.title ? <p className={c('eyebrow')}>{props.wording.title}</p> : null}
        <Names props={props} className="names" />
        {props.wording.since ? <p className={c('since')}>{props.wording.since}</p> : null}
        <span className={c('rule')} aria-hidden />
        <p className={c('coverTitle')}>{copy.welcome}</p>
        <button type="button" className={c('openButton')} onClick={onOpen} disabled={phase !== 'closed'}>
          {props.labels.openInvitation}
        </button>
      </div>
    </div>
  );
}

/** The 3D museum with the design's placard, photo guide and buttons over it. */
function MuseumWalk({ props, copy, reduced, active, onUnavailable }: { props: ThemeProps; copy: Copy; reduced: boolean; active: boolean; onUnavailable: () => void }) {
  const gallery = useRef<Gallery3DHandle>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const [hint, setHint] = useState(true);
  const [sheet, setSheet] = useState<'story' | 'video' | null>(null);
  const touch = useTouchScreen();

  const photos = useMemo(() => [...props.photos].sort((a, b) => a.index - b.index), [props.photos]);
  const video = hasFeature(props, 'video') ? props.video : null;
  const story = props.fields.invitation_message?.trim() || (props.mode === 'sample' ? copy.sampleStory : '');
  const names = [props.fields.person_1_name, props.fields.person_2_name].filter(Boolean).join(` ${props.labels.and} `);

  const signs = useMemo(() => Object.fromEntries(ROOMS.map((key) => [key, props.wording[key] ?? ''])), [props.wording]);
  const screen = useMemo(
    () => (video ? { image: video.poster, play: true } : { image: null, play: false, title: names, body: story || undefined }),
    [video, names, story],
  );

  useEffect(() => {
    if (!active || !ready) return;
    const t = window.setTimeout(() => setHint(false), HINT_MS);
    return () => window.clearTimeout(t);
  }, [active, ready]);
  // Keep the photo in view visible in the guide.
  useEffect(() => {
    if (viewing === null) return;
    rail.current?.querySelector<HTMLElement>(`[data-place="${viewing}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced ? 'auto' : 'smooth' });
  }, [viewing, reduced]);

  const current = viewing === null ? null : photos.find((p) => p.index === viewing) ?? null;
  const currentWords = current ? words(current, props, copy) : null;

  return (
    <section className={c('walk')} data-museum-3d={ready ? 'ready' : 'loading'}>
      <Gallery3D
        ref={gallery}
        className={c('stage')}
        model={MODEL}
        plan={PLAN}
        photos={photos}
        signs={signs}
        screen={screen}
        look={LOOK}
        dir={props.dir}
        reducedMotion={reduced}
        joystickClassName={c('joystick')}
        knobClassName={c('knob')}
        onProgress={setProgress}
        onReady={() => setReady(true)}
        onUnavailable={onUnavailable}
        onView={(i) => {
          setViewing(i);
          if (i !== null) setHint(false);
        }}
        onScreen={() => (video ? setSheet('video') : story ? setSheet('story') : undefined)}
      />

      <div className={c('top')}>
        <div className={c('plaque')}>
          <ThemeBorder border={props.border} fallback={FRAME_BORDER} medium="screen" />
          {props.wording.title ? <p className={c('plaqueTitle')}>{props.wording.title}</p> : null}
          <Names props={props} className="plaqueNames" as="p" />
          {props.wording.since ? <p className={c('plaqueSince')}>{props.wording.since}</p> : null}
        </div>
        {story || video ? (
          <button type="button" className={c('pill')} onClick={() => setSheet(video ? 'video' : 'story')}>
            {video ? copy.video : copy.story}
          </button>
        ) : null}
      </div>

      {active && ready ? <p className={c('hint', !hint && 'hintGone')}>{touch ? copy.hintTouch : copy.hintKeys}</p> : null}

      <div className={c('bottom')}>
        {current && currentWords ? (
          <div className={c('caption')} aria-live="polite">
            <span className={c('captionRoom')}>{roomName(props, copy, roomOf(current.index))}</span>
            {currentWords.title ? <span className={c('captionTitle')}>{currentWords.title}</span> : null}
            {currentWords.caption ? <span className={c('captionText')}>{currentWords.caption}</span> : null}
          </div>
        ) : null}
        {photos.length ? (
          <div ref={rail} className={c('rail')} role="list" aria-label={copy.guide}>
            {photos.map((p) => (
              <button
                key={p.index}
                type="button"
                role="listitem"
                data-place={p.index}
                className={c('thumbButton', viewing === p.index && 'thumbActive')}
                aria-label={words(p, props, copy).title ?? `${roomName(props, copy, roomOf(p.index))} ${(p.index % PER_ROOM) + 1}`}
                onClick={() => gallery.current?.goToPhoto(p.index)}
              >
                <Photo photo={p} className={c('thumb')} />
              </button>
            ))}
          </div>
        ) : null}
        <div className={c('controls')}>
          <button type="button" className={c('pill')} onClick={() => gallery.current?.previous()} disabled={!photos.length}>
            {copy.previous}
          </button>
          <button type="button" className={c('pill', 'pillPrimary')} onClick={() => gallery.current?.next()} disabled={!photos.length}>
            {copy.next}
          </button>
          <button type="button" className={c('pill')} onClick={() => gallery.current?.goToStart()}>
            {copy.entrance}
          </button>
        </div>
      </div>

      <div className={c('loader', ready && 'loaded')} aria-hidden={ready}>
        <span>{copy.loading}</span>
        <span className={c('bar')}>
          <span className={c('barFill')} style={{ display: 'block', width: `${Math.round(progress * 100)}%` }} />
        </span>
      </div>

      {sheet ? (
        <div className={c('sheet')} role="dialog" aria-modal="true" aria-label={sheet === 'video' ? copy.video : copy.story} onClick={() => setSheet(null)}>
          <div className={c('panel')} onClick={(e) => e.stopPropagation()}>
            {sheet === 'video' && video ? <VideoSlot video={video} className={c('video')} controls autoPlay playsInline /> : null}
            {props.wording.title ? <p className={c('plaqueTitle')}>{props.wording.title}</p> : null}
            {names ? <p className={c('plaqueNames')}>{names}</p> : null}
            {story ? <p className={c('panelText')}>{story}</p> : null}
            <button type="button" className={c('pill')} onClick={() => setSheet(null)}>
              {copy.close}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/**
 * The museum shown flat: its rooms one under another, eight framed photos each. Guests see it on a device without 3D;
 * the couple fills it in the editor (every place of the rooms their package sells, the rooms' names, the video).
 */
function FlatMuseum({ props, copy, editing }: { props: ThemeProps; copy: Copy; editing: boolean }) {
  const story = props.fields.invitation_message?.trim() || (props.mode === 'sample' && !editing ? copy.sampleStory : '');
  const rooms = editing ? Math.ceil(props.photoPlaces / PER_ROOM) : ROOMS.length;
  const video = hasFeature(props, 'video');
  return (
    <div className={c('flat')} data-museum-flat>
      <header className={c('flatHeader')}>
        <ThemeBorder border={props.border} fallback={FRAME_BORDER} medium="screen" />
        <EditableText id="wording:title" value={props.wording.title} placeholder={copy.titleHint} as="p" className={c('eyebrow')} />
        {editing ? (
          <h1 className={c('names')}>
            <EditableText id="field:person_1_name" value={props.fields.person_1_name} placeholder={copy.namesHint} />
            <span className={c('and')}>{props.labels.and}</span>
            <EditableText id="field:person_2_name" value={props.fields.person_2_name} placeholder={copy.namesHint} />
          </h1>
        ) : (
          <Names props={props} className="names" />
        )}
        <EditableText id="wording:since" value={props.wording.since} placeholder={copy.sinceHint} as="p" className={c('since')} />
        <EditableText id="field:invitation_message" value={story} placeholder={copy.storyHint} as="p" className={c('panelText')} multiline />
      </header>

      {editing ? <p className={c('note')}>{copy.editorNote}</p> : null}

      {video && (props.video || editing) ? <VideoSlot video={props.video} className={c('videoBox')} controls playsInline label={copy.addVideo} /> : null}

      {Array.from({ length: rooms }, (_, r) => {
        const places = Array.from({ length: PER_ROOM }, (_, i) => r * PER_ROOM + i).filter((i) => editing || props.photos.some((p) => p.index === i));
        if (!places.length) return null;
        return (
          <section key={r} className={c('room')} data-museum-room={r + 1}>
            <EditableText id={`wording:${ROOMS[r]}`} value={props.wording[ROOMS[r]!]} placeholder={copy.roomHint} as="h2" className={c('roomTitle')} />
            <div className={c('grid')}>
              {places.map((i) => {
                const photo = props.photos.find((p) => p.index === i);
                const w = photo ? words(photo, props, copy) : null;
                return (
                  <figure key={i} className={c('figure')}>
                    <div className={c('frame')}>
                      <PhotoSlot index={i} photos={props.photos} set={PER_ROOM} className={c('framePhoto')} label={copy.addPhoto} />
                    </div>
                    {w && (w.title || w.caption) ? (
                      <figcaption className={c('figcaption')}>
                        {w.title ? <span className={c('figTitle')}>{w.title}</span> : null}
                        {w.caption ? <span>{w.caption}</span> : null}
                      </figcaption>
                    ) : null}
                  </figure>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

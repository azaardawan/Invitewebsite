'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
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
/** How long the welcome card stays (unless the guest starts walking first). */
const WELCOME_MS = 6000;

const MODEL = new URL('./assets/museum.glb', import.meta.url).href;

const LOOK = {
  font: "'MM Display', 'Amiri', Georgia, serif",
  textFont: "'MM Text', system-ui, sans-serif",
  signInk: '#e2c27a',
  signGround: '#1d2a2a',
  screenInk: '#f1e9db',
  screenGround: '#14110d',
  labelInk: '#2a2118',
  labelGround: '#f3ebdc',
  labelLine: '#b8924c',
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

/** The room a photo place is in (0-based). */
function roomOf(index: number) {
  return Math.floor(index / PER_ROOM);
}
/** A room's name (the customer's, or "Room 2" when they cleared it) and its few words (or ''). */
function roomName(props: ThemeProps, copy: Copy, room: number) {
  return props.wording[ROOMS[room]!]?.trim() || `${copy.room} ${room + 1}`;
}
function roomText(props: ThemeProps, room: number) {
  return props.wording[`${ROOMS[room]!}Text`]?.trim() ?? '';
}

export default function MemoryMuseum(props: ThemeProps) {
  const editing = useTemplateEditing();
  const reduced = useReducedMotion();
  const copy = copyFor(props.locale);
  const [phase, setPhase] = useState<Phase>('closed');
  const [flat, setFlat] = useState(false);
  const shown: Phase = editing ? 'open' : phase;

  const touch = useTouchScreen();
  const open = () => {
    if (phase !== 'closed') return;
    // Phones walk the museum held sideways (owner, 2026-11-13): where the browser allows it (Android), full screen and
    // locked to landscape; elsewhere the museum asks the guest to turn the phone.
    if (touch) landscape();
    setPhase('opening');
    window.setTimeout(() => setPhase('open'), reduced ? REDUCED_MS : OPENING_MS);
  };

  return (
    <div className={c(fonts.root, 'root', reduced && 'reduced')} dir={props.dir} lang={props.lang} data-phase={shown}>
      {editing ? (
        <MuseumEditor props={props} copy={copy} />
      ) : flat ? (
        <FlatMuseum props={props} copy={copy} />
      ) : (
        <MuseumWalk props={props} copy={copy} reduced={reduced} active={shown === 'open'} onUnavailable={() => setFlat(true)} />
      )}
      {shown !== 'open' ? <Cover props={props} copy={copy} phase={shown} onOpen={open} /> : null}
    </div>
  );
}

/** Full screen, turned sideways (only from a tap; refused quietly where the browser doesn't allow it, e.g. iPhone). */
function landscape() {
  const lock = () => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape');
  document.documentElement
    .requestFullscreen?.({ navigationUI: 'hide' })
    .then(lock)
    .catch(() => {});
}

const PORTRAIT = '(orientation: portrait)';
function subscribePortrait(cb: () => void) {
  const q = window.matchMedia(PORTRAIT);
  q.addEventListener('change', cb);
  return () => q.removeEventListener('change', cb);
}
/** True while a screen is held upright. */
function usePortrait() {
  return useSyncExternalStore(subscribePortrait, () => window.matchMedia(PORTRAIT).matches, () => false);
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
        {/* The design's own words ("Open the museum", manifest pageTexts.open). */}
        <button type="button" className={c('openButton')} onClick={onOpen} disabled={phase !== 'closed'}>
          {props.labels.openInvitation}
        </button>
      </div>
    </div>
  );
}

/**
 * The 3D museum, and nothing else on the screen while guests walk (owner, 2026-11-13): the rooms' names hang over their
 * doorways, each room's plaque on its wall, each photo's title and words under it, the video on the entrance screen.
 * Only a welcome card with the couple's names when the doors open (gone as soon as the guest moves), the touch pad on
 * a phone, and a list of the photos for screen readers (not shown).
 */
function MuseumWalk({ props, copy, reduced, active, onUnavailable }: { props: ThemeProps; copy: Copy; reduced: boolean; active: boolean; onUnavailable: () => void }) {
  const gallery = useRef<Gallery3DHandle>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const [room, setRoom] = useState<string>('hall');
  const [welcome, setWelcome] = useState(true);
  const [sheet, setSheet] = useState(false);
  const touch = useTouchScreen();
  const portrait = usePortrait();
  // A phone held upright: the museum waits until it is turned sideways.
  const turn = touch && portrait && active;

  const photos = useMemo(() => [...props.photos].sort((a, b) => a.index - b.index), [props.photos]);
  const video = hasFeature(props, 'video') ? props.video : null;
  const story = props.fields.invitation_message?.trim() || (props.mode === 'sample' ? copy.sampleStory : '');
  const names = [props.fields.person_1_name, props.fields.person_2_name].filter(Boolean).join(` ${props.labels.and} `);

  const signs = useMemo(() => Object.fromEntries(ROOMS.map((key) => [key, props.wording[key] ?? ''])), [props.wording]);
  const rooms = useMemo(() => Object.fromEntries(ROOMS.map((key, r) => [key, { title: props.wording[key] ?? '', text: roomText(props, r) }])), [props]);
  const labels = useMemo(() => Object.fromEntries(photos.map((p) => [p.index, words(p, props, copy)])), [photos, props, copy]);
  const screen = useMemo(
    () => (video ? { image: video.poster, play: true } : { image: null, play: false, title: names, body: story || undefined }),
    [video, names, story],
  );

  // The welcome card goes after a while, or as soon as the guest starts walking or looking around.
  useEffect(() => {
    if (!active || !ready || !welcome) return;
    const t = window.setTimeout(() => setWelcome(false), WELCOME_MS);
    const away = () => setWelcome(false);
    window.addEventListener('keydown', away, { once: true });
    window.addEventListener('pointerdown', away, { once: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', away);
      window.removeEventListener('pointerdown', away);
    };
  }, [active, ready, welcome]);

  return (
    <section className={c('walk')} data-museum-3d={ready ? 'ready' : 'loading'} data-museum-room-now={room} data-museum-viewing={viewing ?? ''}>
      <Gallery3D
        ref={gallery}
        className={c('stage')}
        model={MODEL}
        plan={PLAN}
        photos={photos}
        labels={labels}
        signs={signs}
        rooms={rooms}
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
          if (i !== null) setWelcome(false);
        }}
        onRoom={(key) => {
          setRoom(key);
          if (key !== 'hall') setWelcome(false);
        }}
        onScreen={() => (video || story ? setSheet(true) : undefined)}
      />

      <div className={c('welcome', !(active && ready && welcome) && 'welcomeGone')} aria-hidden={!welcome}>
        <ThemeBorder border={props.border} fallback={FRAME_BORDER} medium="screen" />
        {props.wording.title ? <p className={c('captionRoom')}>{props.wording.title}</p> : null}
        <Names props={props} className="welcomeNames" as="p" />
        {props.wording.since ? <p className={c('captionText')}>{props.wording.since}</p> : null}
        <p className={c('welcomeHint')}>{touch ? copy.hintTouch : copy.hintKeys}</p>
      </div>

      {turn ? (
        <div className={c('turn')} role="status" data-museum-turn>
          <span className={c('turnPhone')} aria-hidden />
          <p className={c('turnText')}>{copy.rotate}</p>
        </div>
      ) : null}

      {/* For screen readers only: every photo, to walk straight to it (guests who can't walk around). */}
      {photos.length ? (
        <ul className={c('srOnly')} aria-label={copy.guide}>
          {photos.map((p) => (
            <li key={p.index}>
              <button type="button" data-place={p.index} onClick={() => gallery.current?.goToPhoto(p.index)}>
                <Photo photo={p} alt={words(p, props, copy).title ?? `${roomName(props, copy, roomOf(p.index))} ${(p.index % PER_ROOM) + 1}`} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={c('loader', ready && 'loaded')} aria-hidden={ready}>
        <span>{copy.loading}</span>
        <span className={c('bar')}>
          <span className={c('barFill')} style={{ display: 'block', width: `${Math.round(progress * 100)}%` }} />
        </span>
      </div>

      {sheet ? (
        <div className={c('sheet')} role="dialog" aria-modal="true" aria-label={video ? copy.video : copy.story} onClick={() => setSheet(false)}>
          <div className={c('panel')} onClick={(e) => e.stopPropagation()}>
            {video ? <VideoSlot video={video} className={c('video')} controls autoPlay playsInline /> : null}
            {props.wording.title ? <p className={c('plaqueTitle')}>{props.wording.title}</p> : null}
            {names ? <p className={c('plaqueNames')}>{names}</p> : null}
            {story ? <p className={c('panelText')}>{story}</p> : null}
            <button type="button" className={c('pill')} onClick={() => setSheet(false)}>
              {copy.close}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** The museum's header: its name, the couple, the date line and the story (editable in the editor). */
function Header({ props, copy, editing }: { props: ThemeProps; copy: Copy; editing: boolean }) {
  const story = props.fields.invitation_message?.trim() || (props.mode === 'sample' && !editing ? copy.sampleStory : '');
  return (
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
  );
}

/**
 * The museum shown flat, for guests on a device without 3D: its rooms one under another, each with its name, its few
 * words and its framed photos with their words.
 */
function FlatMuseum({ props, copy }: { props: ThemeProps; copy: Copy }) {
  return (
    <div className={c('flat')} data-museum-flat>
      <Header props={props} copy={copy} editing={false} />
      {hasFeature(props, 'video') && props.video ? <VideoSlot video={props.video} className={c('videoBox')} controls playsInline /> : null}
      {ROOMS.map((_, r) => {
        const photos = props.photos.filter((p) => roomOf(p.index) === r).sort((a, b) => a.index - b.index);
        if (!photos.length) return null;
        return (
          <section key={r} className={c('room')} data-museum-room={r + 1}>
            <h2 className={c('roomTitle')}>{roomName(props, copy, r)}</h2>
            {roomText(props, r) ? <p className={c('roomText')}>{roomText(props, r)}</p> : null}
            <div className={c('grid')}>
              {photos.map((p) => {
                const w = words(p, props, copy);
                return (
                  <figure key={p.index} className={c('figure')}>
                    <div className={c('frame')}>
                      <Photo photo={p} className={c('framePhoto')} />
                    </div>
                    {w.title || w.caption ? (
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

/**
 * The editor (template designs are filled in place): the museum's plan with the rooms the package includes, then
 * room by room: its name, its few words, and its eight frames where they hang, along the left wall going in and back
 * along the right wall, each with its title and words under it.
 */
function MuseumEditor({ props, copy }: { props: ThemeProps; copy: Copy }) {
  const rooms = Math.min(ROOMS.length, Math.ceil(props.photoPlaces / PER_ROOM));
  return (
    <div className={c('flat')} data-museum-flat>
      <Header props={props} copy={copy} editing />
      <section className={c('mapBox')}>
        <h2 className={c('mapTitle')}>{copy.mapTitle}</h2>
        <MuseumMap rooms={rooms} names={ROOMS.map((_, r) => roomName(props, copy, r))} copy={copy} />
        <p className={c('note')}>{copy.editorNote}</p>
      </section>

      {hasFeature(props, 'video') ? <VideoSlot video={props.video} className={c('videoBox')} controls playsInline label={copy.addVideo} /> : null}

      {Array.from({ length: rooms }, (_, r) => {
        const place = (i: number) => r * PER_ROOM + i;
        // The left wall from the back to the doorway (places 4…1), the right wall from the back to the doorway (5…8).
        const left = [3, 2, 1, 0].map(place);
        const right = [4, 5, 6, 7].map(place);
        const slot = (i: number) => {
          const photo = props.photos.find((p) => p.index === i);
          return (
            <figure key={i} className={c('wallSpot')}>
              <span className={c('spotNumber')}>{(i % PER_ROOM) + 1}</span>
              <div className={c('frame')}>
                <PhotoSlot index={i} photos={props.photos} set={PER_ROOM} className={c('framePhoto')} label={copy.addPhoto} />
              </div>
              {photo && (photo.title || photo.caption) ? (
                <figcaption className={c('figcaption')}>
                  {photo.title ? <span className={c('figTitle')}>{photo.title}</span> : null}
                  {photo.caption ? <span>{photo.caption}</span> : null}
                </figcaption>
              ) : null}
            </figure>
          );
        };
        return (
          <section key={r} id={`mm-room-${r + 1}`} className={c('room')} data-museum-room={r + 1}>
            <div className={c('roomHead')}>
              <span className={c('roomNumber')}>
                {copy.room} {r + 1}
              </span>
              <MuseumMap rooms={rooms} highlight={r} copy={copy} small />
            </div>
            <EditableText id={`wording:${ROOMS[r]}`} value={props.wording[ROOMS[r]!]} placeholder={copy.roomHint} as="h2" className={c('roomTitle')} />
            <EditableText id={`wording:${ROOMS[r]}Text`} value={props.wording[`${ROOMS[r]!}Text`]} placeholder={copy.roomTextHint} as="p" className={c('roomText')} multiline />
            <p className={c('note')}>{copy.photoHint}</p>
            {/* The room seen from above, with the doorway at the bottom: the walls are drawn as they are, whatever the language. */}
            <div className={c('roomPlan')} dir="ltr">
              <div className={c('wall')}>
                <span className={c('wallName')} dir={props.dir}>
                  {copy.leftWall}
                </span>
                {left.map(slot)}
              </div>
              <div className={c('floor')} aria-hidden />
              <div className={c('wall')}>
                <span className={c('wallName')} dir={props.dir}>
                  {copy.rightWall}
                </span>
                {right.map(slot)}
              </div>
              <div className={c('doorway')} dir={props.dir}>
                <span aria-hidden>↑</span> {copy.doorway}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * The museum from above: the hall with the entrance at the bottom, the front wing (rooms 1–2) ahead, the left wing
 * (3–4) and the right wing (5–6). The package's rooms are gilt (links to their part of the editor), the others dashed.
 * `highlight`: one room picked out (the room being filled).
 */
function MuseumMap({ rooms, highlight, names, copy, small = false }: { rooms: number; highlight?: number; names?: string[]; copy: Copy; small?: boolean }) {
  const ROOM_BOXES = [
    [125, 82],
    [125, 28],
    [70, 136],
    [16, 136],
    [180, 136],
    [234, 136],
  ] as const;
  return (
    <svg className={c(small ? 'mapSmall' : 'map')} viewBox="0 0 300 236" role="img" aria-label={copy.mapTitle} direction="ltr">
      <path className={c('mapHall')} d="M125 136h50v50h-50z" />
      <path className={c('mapEntrance')} d="M150 222v-26m-7 9 7-9 7 9" />
      {ROOM_BOXES.map(([x, y], r) => {
        const sold = r < rooms;
        const box = (
          <g key={r} className={c('mapRoom', sold ? 'mapSold' : 'mapClosed', highlight === r && 'mapHere')}>
            <rect x={x} y={y} width={50} height={50} rx={2} />
            <text x={x + 25} y={y + 31} textAnchor="middle">
              {r + 1}
            </text>
            {names && sold ? <title>{names[r]}</title> : null}
          </g>
        );
        return sold && !small ? (
          <a key={r} href={`#mm-room-${r + 1}`}>
            {box}
          </a>
        ) : (
          box
        );
      })}
    </svg>
  );
}

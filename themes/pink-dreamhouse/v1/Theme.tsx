'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  ATTACHED_PHOTO_PLACE,
  EditableText,
  Photo,
  PhotoSlot,
  ThemeBorder,
  VideoSlot,
  World3D,
  hasFeature,
  useMusic,
  useReducedMotion,
  useTemplateEditing,
  useTouchScreen,
  type ThemePhoto,
  type ThemeProps,
  type World3DHandle,
  type WorldTap,
} from '@/theme-sdk';
import { HEART_BORDER } from './border';
import { copyFor, type Copy } from './copy';
import { BLUSH, DRAWER_COUNT, DRAWERS, FIRST_PHOTO, MODELS, PHOTO_SET, ROOMS, TIERS, VIDEO_COUNT, planFor, tierOf, type Tier } from './plan';
import { FRIENDS_ROOM_NAMES, ROOM_NAMES } from './texts';
import fonts from './fonts.module.css';
import s from './theme.module.css';

type Phase = 'closed' | 'opening' | 'open';
const OPENING_MS = 1300;
const REDUCED_MS = 300;
const WELCOME_MS = 6000;

const LOOK = { font: "'PDH Sans', system-ui, sans-serif", ink: '#7a2d52', ground: '#fff6fa', line: '#c7a16a' };

const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');

/** The package's house (by the photos it sells). */
function tierFor(props: ThemeProps): Tier {
  return tierOf(props.photoPlaces, props.videos.length, hasFeature(props, 'photos'));
}
const inTier = (tier: Tier, roomTier: Tier) => TIERS.indexOf(roomTier) <= TIERS.indexOf(tier);

/** A changeable line as shown; for friends, the rooms that speak of a birthday say the house is theirs. */
function word(props: ThemeProps, key: string): string {
  const value = props.wording[key] ?? '';
  const m = /^room(\d)$/.exec(key);
  if (props.occasion !== 'friends' || !m) return value;
  const i = Number(m[1]) - 1;
  const friends = FRIENDS_ROOM_NAMES[i];
  return friends && value === ROOM_NAMES[i]![props.locale] ? friends[props.locale] : value;
}
function roomName(props: ThemeProps, copy: Copy, r: number) {
  return word(props, `room${r + 1}`).trim() || `${copy.room} ${r + 1}`;
}
/** The person (or the two friends) the house is for. */
function names(props: ThemeProps) {
  return [props.fields.person_1_name, props.fields.person_2_name].filter(Boolean).join(` ${props.labels.and} `);
}
/** The colours: the customer's colour set, or the house's own. */
function colorsOf(props: ThemeProps): Record<string, string> {
  return { ...BLUSH, ...props.colors };
}

/** The things that open (besides the drawers), each with its room: counted in the room's counter. */
const OPENABLES = [
  { key: 'gift', room: 'living' },
  { key: 'cupcake', room: 'kitchen' },
  { key: 'mirror', room: 'vanity' },
  { key: 'chest', room: 'secret' },
];
/** Keys counted as opened (drawers by '#'). */
const COUNTED = new Set(['drawer#', 'gift', 'cupcake', 'mirror', 'chest']);

/** A thing's name on its button. */
function thingName(copy: Copy, key: string) {
  const drawer = /^drawer(\d)$/.exec(key);
  if (drawer) return `${copy.drawer} ${drawer[1]}`;
  if (/^door\d$/.test(key) || key === 'secretDoor') return copy.things.door;
  return copy.things[key as keyof Copy['things']] ?? '';
}

// ---- what the visitor has found, kept for their next visit ----

/** What the visitor has opened: the drawers (for the suite), and every thing that opens (for the rooms' counters). */
type Found = { drawers: number[]; gift: boolean; chest: boolean; opened: string[] };
const EMPTY: Found = { drawers: [], gift: false, chest: false, opened: [] };
const storeKey = () => `pdh:${window.location.pathname}`;
function readFound(): Found {
  try {
    const raw = window.localStorage.getItem(storeKey());
    const v = raw ? (JSON.parse(raw) as Partial<Found>) : null;
    return {
      drawers: Array.isArray(v?.drawers) ? v.drawers.filter((n) => Number.isInteger(n)) : [],
      gift: !!v?.gift,
      chest: !!v?.chest,
      opened: Array.isArray(v?.opened) ? v.opened.filter((k): k is string => typeof k === 'string') : [],
    };
  } catch {
    return EMPTY;
  }
}
function saveFound(f: Found) {
  try {
    window.localStorage.setItem(storeKey(), JSON.stringify(f));
  } catch {
    // Private windows: progress is only for this visit.
  }
}

export default function PinkDreamhouse(props: ThemeProps) {
  const editing = useTemplateEditing();
  const reduced = useReducedMotion();
  const copy = copyFor(props.locale, props.occasion);
  const [phase, setPhase] = useState<Phase>('closed');
  const [flat, setFlat] = useState(false);
  const shown: Phase = editing ? 'open' : phase;
  const touch = useTouchScreen();
  const music = useMusic();
  const open = () => {
    if (phase !== 'closed') return;
    // The music starts on the visitor's tap (phones play sound only after one); never by itself.
    music.start();
    if (touch) landscape();
    setPhase('opening');
    window.setTimeout(() => setPhase('open'), reduced ? REDUCED_MS : OPENING_MS);
  };
  return (
    <div className={c(fonts.root, 'root', reduced && 'reduced')} dir={props.dir} lang={props.lang} data-phase={shown} style={{ ['--pdh-accent' as string]: colorsOf(props).accent, ['--pdh-walls' as string]: colorsOf(props).walls }}>
      {editing ? (
        <HouseEditor props={props} copy={copy} />
      ) : flat ? (
        <FlatHouse props={props} copy={copy} />
      ) : (
        <HouseWalk props={props} copy={copy} reduced={reduced} active={shown === 'open'} onUnavailable={() => setFlat(true)} />
      )}
      {shown !== 'open' ? <Cover props={props} copy={copy} phase={shown} onOpen={open} /> : null}
    </div>
  );
}

/** Full screen, turned sideways (only from a tap; refused quietly where the browser doesn't allow it). */
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
function usePortrait() {
  return useSyncExternalStore(subscribePortrait, () => window.matchMedia(PORTRAIT).matches, () => false);
}

/** The little house drawn on the cover. */
function HouseMark() {
  return (
    <svg className={c('houseMark')} viewBox="0 0 120 100" aria-hidden>
      <path d="M10 46 60 10l50 36" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="22" y="44" width="76" height="48" rx="4" fill="var(--pdh-walls)" />
      <path d="M22 68h76M60 44v48" stroke="#fff" strokeWidth="2.5" opacity=".8" />
      <path d="M52 92V78a8 8 0 0 1 16 0v14" fill="#fff" />
      <path d="M60 30c-3-4-9-2-8 3 1 4 8 8 8 8s7-4 8-8c1-5-5-7-8-3z" fill="currentColor" />
    </svg>
  );
}

function Cover({ props, copy, phase, onOpen }: { props: ThemeProps; copy: Copy; phase: Phase; onOpen: () => void }) {
  const who = names(props);
  return (
    <div className={c('cover')} data-phase={phase}>
      <div className={c('card')}>
        <ThemeBorder border={props.border} fallback={HEART_BORDER} medium="screen" />
        <HouseMark />
        <p className={c('eyebrow')}>{copy.happyBirthday}</p>
        {who ? <h1 className={c('names')}>{who}</h1> : null}
        <p className={c('coverText')}>{copy.welcome}</p>
        {/* The design's own words ("Enter the house", manifest pageTexts.open). */}
        <button type="button" className={c('openButton')} onClick={onOpen} disabled={phase !== 'closed'}>
          {props.labels.openInvitation}
        </button>
      </div>
    </div>
  );
}

type Card = { title: string; body: string; photo?: ThemePhoto | null } | null;

/** Bursts of confetti over the house (none with reduced motion). */
function Confetti({ burst, big }: { burst: number; big: boolean }) {
  const pieces = useMemo(() => {
    if (!burst) return [];
    const n = big ? 90 : 40;
    // A fixed pattern per burst (no randomness during render).
    return Array.from({ length: n }, (_, i) => {
      const k = (i * 7919 + burst * 104729) % 1000;
      return { left: (k * 37) % 100, delay: (k % 600) / 1000, hue: ['#f6b8cf', '#de709b', '#c7a16a', '#e3cdec', '#fff'][i % 5], size: 6 + (k % 7), spin: (k % 2 ? 1 : -1) * (180 + (k % 360)) };
    });
  }, [burst, big]);
  if (!pieces.length) return null;
  return (
    <div key={burst} className={c('confetti')} aria-hidden>
      {pieces.map((p, i) => (
        <span key={i} style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, background: p.hue, width: p.size, height: p.size * 0.5, ['--spin' as string]: `${p.spin}deg` }} />
      ))}
    </div>
  );
}

/**
 * The house in 3D: walk through it, tap photos to see them, drawers for the customer's messages, the gift, the cake's
 * switch, the cupcake, the mirror, the screens and (biggest package) the secret suite's door and its golden chest.
 */
function HouseWalk({ props, copy, reduced, active, onUnavailable }: { props: ThemeProps; copy: Copy; reduced: boolean; active: boolean; onUnavailable: () => void }) {
  const world = useRef<World3DHandle>(null);
  const tier = tierFor(props);
  const plan = useMemo(() => planFor(tier), [tier]);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [welcome, setWelcome] = useState(true);
  const [card, setCard] = useState<Card>(null);
  const [photo, setPhoto] = useState<ThemePhoto | null>(null);
  const [video, setVideo] = useState<{ place: number; playing: boolean; muted: boolean } | null>(null);
  const [burst, setBurst] = useState({ n: 0, big: false });
  const [found, setFound] = useState<Found>(() => (typeof window === 'undefined' ? EMPTY : readFound()));
  const touch = useTouchScreen();
  const portrait = usePortrait();
  const music = useMusic();
  const paused = useRef(false);
  const turn = touch && portrait && active;
  const who = names(props);
  const message = props.fields.invitation_message?.trim() ?? '';

  // The house's photo places (the drawers' own photos are shown when a drawer opens).
  const photos = useMemo(() => props.photos.filter((p) => p.index < ATTACHED_PHOTO_PLACE).sort((a, b) => a.index - b.index), [props.photos]);
  const drawerPhoto = (n: number) => props.photos.find((p) => p.index === ATTACHED_PHOTO_PLACE + n - 1) ?? null;
  const videos = useMemo(() => (hasFeature(props, 'video') ? props.videos.slice(0, VIDEO_COUNT[tier]) : []), [props, tier]);
  const texts = useMemo(() => Object.fromEntries(ROOMS.map((r, i) => [r.key, roomName(props, copy, i)])), [props, copy]);
  const colors = useMemo(() => colorsOf(props), [props]);

  const drawers = DRAWER_COUNT[tier];
  // The suite opens once every drawer outside it has been opened (VVIP).
  const needed = DRAWERS.slice(0, drawers).flatMap((d, i) => (d.room === 'secret' ? [] : [i + 1]));
  const unlocked = tier === 'vvip' && needed.every((n) => found.drawers.includes(n));

  const remember = useCallback((change: (f: Found) => Found) => {
    setFound((f) => {
      const next = change(f);
      saveFound(next);
      return next;
    });
  }, []);
  const celebrate = (big: boolean) => !reduced && setBurst((b) => ({ n: b.n + 1, big }));
  const press = (key: string) => {
    world.current?.set(key, true);
    window.setTimeout(() => world.current?.set(key, false), 380);
  };
  const playVideo = (place: number) => {
    if (!videos[place]) return;
    world.current?.playVideo(place);
  };

  // The suite's door opens as soon as the last memory is found (and stays open on the next visit).
  const announced = useRef(false);
  useEffect(() => {
    if (!ready || !unlocked) return;
    announced.current = true;
    opened.current.add('secretDoor');
    world.current?.set('secretDoor', true);
  }, [ready, unlocked]);

  // What is open in the house right now (drawers, the gift's lid…), to close it on a second tap.
  const opened = useRef(new Set<string>());
  const [openKeys, setOpenKeys] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string, open: boolean) => {
    if (open) opened.current.add(key);
    else opened.current.delete(key);
    if (open && COUNTED.has(key.replace(/\d$/, '#'))) remember((f) => (f.opened.includes(key) ? f : { ...f, opened: [...f.opened, key] }));
    setOpenKeys(new Set(opened.current));
    world.current?.set(key, open);
  };
  // The things the visitor is next to and facing: a button for each (owner, 2026-11-19: "Open" by a drawer, without
  // having to crouch to tap a low one).
  const [near, setNear] = useState<string[]>([]);
  const [room, setRoom] = useState<string>('living');
  const usable = (key: string) => {
    const drawer = /^drawer(\d)$/.exec(key);
    if (drawer) return Number(drawer[1]) <= drawers;
    if (key === 'gift' || /^door\d$/.test(key)) return true;
    if (key === 'confetti' || key === 'cupcake' || key === 'mirror') return tier !== 'basic';
    return tier === 'vvip' && ['golden', 'projector', 'secretDoor', 'chest', 'finale'].includes(key);
  };
  const PRESSED = ['confetti', 'golden', 'projector', 'finale'];

  const onTap = (tap: WorldTap) => {
    setWelcome(false);
    if (tap.kind === 'photo') {
      setPhoto(photos.find((p) => p.index === tap.index) ?? null);
      return;
    }
    if (tap.kind === 'screen') return playVideo(tap.place);
    const key = tap.key;
    const drawer = /^drawer(\d)$/.exec(key);
    if (drawer) {
      const n = Number(drawer[1]);
      if (n > drawers) return;
      const opening = !opened.current.has(key);
      toggle(key, opening);
      if (opening) {
        const before = needed.every((x) => found.drawers.includes(x));
        remember((f) => ({ ...f, drawers: [...new Set([...f.drawers, n])] }));
        const after = needed.every((x) => x === n || found.drawers.includes(x));
        if (tier === 'vvip' && !before && after && !announced.current) {
          announced.current = true;
          setCard({ title: copy.unlocked, body: word(props, key), photo: drawerPhoto(n) });
          celebrate(true);
          return;
        }
        setCard({ title: `${copy.drawer} ${n}`, body: word(props, key), photo: drawerPhoto(n) });
      }
      return;
    }
    switch (key) {
      case 'gift': {
        const opening = !opened.current.has(key);
        toggle(key, opening);
        if (opening) {
          remember((f) => ({ ...f, gift: true }));
          setCard({ title: who ? `${copy.happyBirthday}, ${who}!` : copy.happyBirthday, body: word(props, 'gift') });
          celebrate(tier !== 'basic');
        }
        return;
      }
      case 'confetti':
        if (tier === 'basic') return;
        press(key);
        return celebrate(true);
      case 'golden':
        if (tier !== 'vvip') return;
        press(key);
        celebrate(true);
        return setCard({ title: who ? `${copy.happyBirthday}, ${who}!` : copy.happyBirthday, body: message || word(props, 'gift') });
      case 'cupcake':
      case 'mirror': {
        if (tier === 'basic') return;
        const opening = !opened.current.has(key);
        toggle(key, opening);
        if (opening) setCard({ title: copy.fromHeart, body: word(props, key) });
        return;
      }
      case 'projector':
        if (tier !== 'vvip') return;
        press(key);
        return playVideo(1);
      case 'secretDoor':
        if (tier !== 'vvip') return;
        if (unlocked) return toggle(key, !opened.current.has(key));
        return setCard({ title: copy.memories.replace('{n}', String(needed.filter((n) => found.drawers.includes(n)).length)).replace('{m}', String(needed.length)), body: copy.locked });
      case 'chest': {
        if (tier !== 'vvip') return;
        const opening = !opened.current.has(key);
        toggle(key, opening);
        if (opening) {
          remember((f) => ({ ...f, chest: true }));
          celebrate(true);
          setCard({ title: copy.fromHeart, body: word(props, 'chest') });
          playVideo(2);
        }
        return;
      }
      case 'finale':
        if (tier !== 'vvip') return;
        press(key);
        celebrate(true);
        return setCard({ title: who ? `${copy.happyBirthday}, ${who}!` : copy.happyBirthday, body: message || word(props, 'chest') });
      case 'door1':
      case 'door2':
      case 'door3':
        // A door between rooms: opened (and closed) like a door.
        return toggle(key, !opened.current.has(key));
      case 'stairsUp':
      case 'stairsDown':
        if (tier === 'basic') return;
        return world.current?.set(key, true);
    }
  };
  // The music pauses while a video plays (it has its own sound) and comes back after.
  const onVideo = (place: number, state: 'playing' | 'paused' | 'ended') => {
    if (state === 'playing') {
      if (music.playing) {
        music.toggle();
        paused.current = true;
      }
      setVideo((v) => ({ place, playing: true, muted: v?.place === place ? v.muted : false }));
    } else if (state === 'paused') {
      setVideo((v) => (v ? { ...v, playing: false } : v));
    } else {
      setVideo(null);
      if (paused.current) {
        paused.current = false;
        music.toggle();
      }
    }
  };
  const closeVideo = () => {
    world.current?.stopVideo();
    onVideo(video?.place ?? 0, 'ended');
  };

  // The welcome card goes after a while, or as soon as the visitor moves.
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

  const foundCount = needed.filter((n) => found.drawers.includes(n)).length;
  // The things of the room the visitor is in that open, and how many of them they have opened.
  const roomItems = [...OPENABLES.filter((o) => o.room === room && usable(o.key)), ...DRAWERS.slice(0, drawers).flatMap((d, i) => (d.room === room ? [{ key: `drawer${i + 1}`, room }] : []))];
  const roomOpened = roomItems.filter((o) => found.opened.includes(o.key) || (o.key.startsWith('drawer') && found.drawers.includes(Number(o.key.slice(6)))) || (o.key === 'gift' && found.gift) || (o.key === 'chest' && found.chest)).length;
  const allDrawers = Array.from({ length: drawers }, (_, i) => i + 1);

  return (
    <section className={c('walk')} data-house-3d={ready ? 'ready' : 'loading'} data-house-tier={tier} data-house-unlocked={ready ? (unlocked ? 'yes' : 'no') : undefined}>
      <World3D
        ref={world}
        className={c('stage')}
        model={MODELS[tier]}
        plan={plan}
        photos={photos}
        videos={videos}
        texts={texts}
        colors={colors}
        look={LOOK}
        dir={props.dir}
        reducedMotion={reduced}
        joystickClassName={c('joystick')}
        knobClassName={c('knob')}
        onProgress={setProgress}
        onReady={() => setReady(true)}
        onUnavailable={onUnavailable}
        onTap={onTap}
        onRoom={(key) => {
          setWelcome(false);
          setRoom(key);
        }}
        onNear={setNear}
        onVideo={onVideo}
      />

      <div className={c('welcome', !(active && ready && welcome) && 'welcomeGone')} aria-hidden={!welcome}>
        <ThemeBorder border={props.border} fallback={HEART_BORDER} medium="screen" />
        <p className={c('eyebrow')}>{copy.happyBirthday}</p>
        {who ? <p className={c('welcomeNames')}>{who}</p> : null}
        <p className={c('welcomeHint')}>{touch ? copy.hintTouch : copy.hintKeys}</p>
      </div>

      {/* In each room, how many of its things the visitor has opened (owner, 2026-11-19); and in the biggest house, the
          memories found towards the secret suite. */}
      {active && ready ? (
        <div className={c('counters')}>
          {roomItems.length ? (
            <p className={c('counter')} role="status" data-house-room-count={`${roomOpened}/${roomItems.length}`}>
              {copy.roomCount.replace('{n}', String(roomOpened)).replace('{m}', String(roomItems.length))}
            </p>
          ) : null}
          {tier === 'vvip' && foundCount > 0 ? (
            <p className={c('counter')} data-house-found={foundCount}>
              {copy.memories.replace('{n}', String(foundCount)).replace('{m}', String(needed.length))}
            </p>
          ) : null}
        </div>
      ) : null}

      {music.available && active ? (
        <button
          type="button"
          className={c('sound', !music.playing && 'soundOff')}
          aria-pressed={music.playing}
          aria-label={music.playing ? props.labels.musicPause : props.labels.musicPlay}
          onClick={() => music.toggle()}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            {music.playing ? (
              <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M16.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>
      ) : null}

      {/* While a video plays: pause, sound and close. */}
      {video ? (
        <div className={c('videoBar')} data-house-video={video.place}>
          <button type="button" className={c('barButton')} onClick={() => (video.playing ? world.current?.pauseVideo() : world.current?.playVideo(video.place))}>
            {video.playing ? copy.pause : copy.play}
          </button>
          <button
            type="button"
            className={c('barButton')}
            onClick={() => {
              world.current?.muteVideo(!video.muted);
              setVideo({ ...video, muted: !video.muted });
            }}
          >
            {video.muted ? copy.unmute : copy.mute}
          </button>
          <button type="button" className={c('barButton')} onClick={closeVideo}>
            {copy.stopVideo}
          </button>
        </div>
      ) : null}

      {/* By something to open or press: a button for it (it can be tapped in the house too). */}
      {active && ready && !card && !photo && near.some(usable) ? (
        <div className={c('nearButtons')}>
          {near.filter(usable).map((key) => (
            <button key={key} type="button" className={c('nearButton')} data-house-near={key} onClick={() => onTap({ kind: 'thing', key })}>
              {PRESSED.includes(key) ? copy.press : openKeys.has(key) ? copy.close : copy.open}
              <span className={c('nearName')}> · {thingName(copy, key)}</span>
            </button>
          ))}
        </div>
      ) : null}

      <Confetti burst={burst.n} big={burst.big} />

      {card ? (
        <div className={c('sheet')} role="dialog" aria-modal="true" aria-label={card.title} onClick={() => setCard(null)} data-house-card>
          <div className={c('note')} onClick={(e) => e.stopPropagation()}>
            <p className={c('noteTitle')}>{card.title}</p>
            {card.photo ? <Photo photo={card.photo} className={c('notePhoto')} /> : null}
            {card.body ? <p className={c('noteBody')}>{card.body}</p> : null}
            <button type="button" className={c('pill')} onClick={() => setCard(null)}>
              {copy.close}
            </button>
          </div>
        </div>
      ) : null}

      {photo ? (
        <div className={c('sheet')} role="dialog" aria-modal="true" aria-label={photo.title ?? roomName(props, copy, roomOf(photo.index))} onClick={() => setPhoto(null)} data-house-photo={photo.index}>
          <figure className={c('bigPhoto')} onClick={(e) => e.stopPropagation()}>
            <Photo photo={photo} className={c('bigPhotoImg')} />
            {photo.title || photo.caption ? (
              <figcaption className={c('bigCaption')}>
                {photo.title ? <b>{photo.title}</b> : null}
                {photo.caption ? <span>{photo.caption}</span> : null}
              </figcaption>
            ) : null}
            <button type="button" className={c('pill')} onClick={() => setPhoto(null)}>
              {copy.close}
            </button>
          </figure>
        </div>
      ) : null}

      {turn ? (
        <div className={c('turn')} role="status" data-house-turn>
          <span className={c('turnPhone')} aria-hidden />
          <p className={c('turnText')}>{copy.rotate}</p>
        </div>
      ) : null}

      {/* For screen readers and keyboards: the photos and the drawers' messages, without walking. */}
      <ul className={c('srOnly')} aria-label={copy.mapTitle}>
        {photos.map((p) => (
          <li key={p.index}>
            <button type="button" data-place={p.index} onClick={() => setPhoto(p)}>
              <Photo photo={p} alt={p.title ?? `${roomName(props, copy, roomOf(p.index))} ${p.index + 1}`} />
            </button>
          </li>
        ))}
        {allDrawers.map((n) => (
          <li key={n}>
            <button type="button" data-drawer={n} onClick={() => onTap({ kind: 'thing', key: `drawer${n}` })}>
              {copy.drawer} {n}
            </button>
          </li>
        ))}
        <li>
          <button type="button" data-thing="gift" onClick={() => onTap({ kind: 'thing', key: 'gift' })}>
            {copy.happyBirthday}
          </button>
        </li>
        {tier !== 'basic' ? (
          <>
            <li>
              <button type="button" data-thing="stairsUp" onClick={() => onTap({ kind: 'thing', key: 'stairsUp' })}>
                {copy.floorUpper}
              </button>
            </li>
            <li>
              <button type="button" data-thing="stairsDown" onClick={() => onTap({ kind: 'thing', key: 'stairsDown' })}>
                {copy.floorGround}
              </button>
            </li>
          </>
        ) : null}
      </ul>

      <div className={c('loader', ready && 'loaded')} aria-hidden={ready}>
        <HouseMark />
        <span>{copy.loading}</span>
        <span className={c('bar')}>
          <span className={c('barFill')} style={{ display: 'block', width: `${Math.round(progress * 100)}%` }} />
        </span>
      </div>
    </section>
  );
}

/** The room a photo place is in (index into ROOMS). */
function roomOf(index: number) {
  let r = ROOMS.length - 1;
  while (r > 0 && FIRST_PHOTO[r]! > index) r--;
  return r;
}

/** The house's rooms in the package, in order. */
function roomsOf(tier: Tier) {
  return ROOMS.map((room, i) => ({ room, i })).filter(({ room }) => inTier(tier, room.tier));
}
/** The drawers of a room (their numbers, 1-based) within the package. */
function drawersIn(tier: Tier, key: string) {
  return DRAWERS.slice(0, DRAWER_COUNT[tier]).flatMap((d, i) => (d.room === key ? [i + 1] : []));
}

/** The house shown flat, for visitors on a device without 3D: room by room, with its photos, messages and videos. */
function FlatHouse({ props, copy }: { props: ThemeProps; copy: Copy }) {
  const tier = tierFor(props);
  const who = names(props);
  const videos = hasFeature(props, 'video') ? props.videos.slice(0, VIDEO_COUNT[tier]) : [];
  const message = props.fields.invitation_message?.trim();
  return (
    <div className={c('flat')} data-house-flat>
      <header className={c('flatHeader')}>
        <ThemeBorder border={props.border} fallback={HEART_BORDER} medium="screen" />
        <HouseMark />
        <p className={c('eyebrow')}>{copy.happyBirthday}</p>
        {who ? <h1 className={c('names')}>{who}</h1> : null}
        {message ? <p className={c('flatText')}>{message}</p> : null}
        <p className={c('flatNote')}>{word(props, 'gift')}</p>
      </header>
      {roomsOf(tier).map(({ room, i }) => {
        const photos = props.photos.filter((p) => roomOf(p.index) === i).sort((a, b) => a.index - b.index);
        const place = room.key === 'kitchen' ? 0 : room.key === 'cinema' ? 1 : room.key === 'secret' ? 2 : -1;
        const extra = room.key === 'kitchen' ? 'cupcake' : room.key === 'vanity' ? 'mirror' : room.key === 'secret' ? 'chest' : null;
        return (
          <section key={room.key} className={c('room')} data-house-room={room.key}>
            <h2 className={c('roomTitle')}>{roomName(props, copy, i)}</h2>
            {photos.length ? (
              <div className={c('grid')}>
                {photos.map((p) => (
                  <figure key={p.index} className={c('figure')}>
                    <Photo photo={p} className={c('framePhoto')} />
                    {p.title || p.caption ? (
                      <figcaption className={c('figcaption')}>
                        {p.title ? <b>{p.title}</b> : null}
                        {p.caption ? <span>{p.caption}</span> : null}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            ) : null}
            {place >= 0 && videos[place] ? <VideoSlot video={videos[place]!} place={place} className={c('videoBox')} controls playsInline /> : null}
            {[...drawersIn(tier, room.key).map((n) => `drawer${n}`), ...(extra ? [extra] : [])].map((k) => {
              const n = /^drawer(\d)$/.exec(k);
              const own = n ? props.photos.find((p) => p.index === ATTACHED_PHOTO_PLACE + Number(n[1]) - 1) : undefined;
              return word(props, k).trim() || own ? (
                <div key={k} className={c('flatDrawer')}>
                  {own ? <Photo photo={own} className={c('notePhoto')} /> : null}
                  {word(props, k).trim() ? <p className={c('flatNote')}>{word(props, k)}</p> : null}
                </div>
              ) : null;
            })}
          </section>
        );
      })}
    </div>
  );
}

/**
 * The editor (template designs are filled in place): the house's map with the package's rooms, then room by room: its
 * name, its photos (left to right on its back wall), its drawers' messages, and its own surprises (the gift, the
 * cupcake, the mirror, the chest) and screens.
 */
function HouseEditor({ props, copy }: { props: ThemeProps; copy: Copy }) {
  const tier = tierFor(props);
  const videos = hasFeature(props, 'video') ? props.videos.slice(0, VIDEO_COUNT[tier]) : [];
  const friends = props.occasion === 'friends';
  return (
    <div className={c('flat', 'editor')} data-house-flat data-house-tier={tier}>
      <header className={c('flatHeader')}>
        <ThemeBorder border={props.border} fallback={HEART_BORDER} medium="screen" />
        <HouseMark />
        <p className={c('eyebrow')}>{copy.happyBirthday}</p>
        <h1 className={c('names')}>
          <EditableText id="field:person_1_name" value={props.fields.person_1_name} placeholder={copy.namesHint} />
          {friends ? (
            <>
              <span className={c('and')}>{props.labels.and}</span>
              <EditableText id="field:person_2_name" value={props.fields.person_2_name} placeholder={copy.namesHint} />
            </>
          ) : null}
        </h1>
        <EditableText id="field:invitation_message" value={props.fields.invitation_message} placeholder={copy.messageHint} as="p" className={c('flatText')} multiline />
      </header>

      <section className={c('mapBox')}>
        <h2 className={c('mapTitle')}>{copy.mapTitle}</h2>
        <HouseMap tier={tier} names={ROOMS.map((_, i) => roomName(props, copy, i))} copy={copy} />
        <p className={c('flatNote')}>{copy.editorNote}</p>
      </section>

      {roomsOf(tier).map(({ room, i }) => {
        const first = FIRST_PHOTO[i]!;
        const place = room.key === 'kitchen' ? 0 : room.key === 'cinema' ? 1 : room.key === 'secret' ? 2 : -1;
        const extras = room.key === 'living' ? ['gift'] : room.key === 'kitchen' ? ['cupcake'] : room.key === 'vanity' ? ['mirror'] : room.key === 'secret' ? ['chest'] : [];
        return (
          <section key={room.key} id={`pdh-${room.key}`} className={c('room')} data-house-room={room.key}>
            <p className={c('roomNumber')}>
              {copy.room} {i + 1} · {room.floor ? copy.floorUpper : copy.floorGround}
            </p>
            <EditableText id={`wording:room${i + 1}`} value={word(props, `room${i + 1}`)} placeholder={copy.roomHint} as="h2" className={c('roomTitle')} />
            <p className={c('flatNote')}>{copy.photosHint}</p>
            <div className={c('wallRow', room.photos > 3 && 'wallWide')}>
              {Array.from({ length: room.photos }, (_, k) => (
                <div key={k} className={c('frame')}>
                  <PhotoSlot index={first + k} photos={props.photos} set={PHOTO_SET} className={c('framePhoto')} label={copy.addPhoto} />
                </div>
              ))}
            </div>
            {place >= 0 && place < videos.length ? (
              <VideoSlot video={videos[place] ?? null} place={place} className={c('videoBox')} controls playsInline label={copy.addVideo} />
            ) : null}
            {[
              ...drawersIn(tier, room.key).map((n) => ({ key: `drawer${n}`, label: `${copy.drawer} ${n}`, place: ATTACHED_PHOTO_PLACE + n - 1 })),
              ...extras.map((k) => ({ key: k, label: copy.fromHeart, place: -1 })),
            ].map((t) => (
              <div key={t.key} className={c('noteEdit', t.place >= 0 && 'noteEditPhoto')} data-house-drawer-edit={t.place >= 0 ? t.key : undefined}>
                <span className={c('noteLabel')}>{t.label}</span>
                {/* A drawer holds a message, and a photo if the customer adds one (owner, 2026-11-19). */}
                {t.place >= 0 ? (
                  <div className={c('drawerPhoto')}>
                    <PhotoSlot index={t.place} photos={props.photos} className={c('framePhoto')} label={copy.drawerPhoto} />
                  </div>
                ) : null}
                <EditableText id={`wording:${t.key}`} value={word(props, t.key)} placeholder={copy.textHint} as="p" className={c('noteText')} multiline />
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

/** The house from the front: upstairs over downstairs, three rooms each; the package's rooms in colour. */
function HouseMap({ tier, names, copy }: { tier: Tier; names: string[]; copy: Copy }) {
  const BOX = [
    [10, 86],
    [104, 86],
    [198, 86],
    [10, 18],
    [104, 18],
    [198, 18],
  ] as const;
  return (
    <svg className={c('map')} viewBox="0 0 292 150" role="img" aria-label={copy.mapTitle} direction="ltr">
      {ROOMS.map((room, i) => {
        const [x, y] = BOX[i]!;
        const sold = inTier(tier, room.tier);
        const box = (
          <g key={room.key} className={c('mapRoom', sold ? 'mapSold' : 'mapClosed')}>
            <rect x={x} y={y} width={84} height={58} rx={4} />
            <text x={x + 42} y={y + 34} textAnchor="middle">
              {i + 1}
            </text>
            <title>{sold ? names[i] : `${names[i]} · ${copy.notInPackage}`}</title>
          </g>
        );
        return sold ? (
          <a key={room.key} href={`#pdh-${room.key}`}>
            {box}
          </a>
        ) : (
          box
        );
      })}
    </svg>
  );
}

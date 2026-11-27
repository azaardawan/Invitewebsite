'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { formatNumber, GUEST_LIMITS, type GuestResponseInput, type GuestSignature, type GuestSubmitResult, type InvitationLocale, type InvitationMode, type ThemeLabels } from './types';

type RuntimeValue = {
  mode: InvitationMode;
  labels: ThemeLabels;
  musicSrc: string | null;
  guest: {
    enabled: boolean;
    withMessage: boolean;
    submit?: (input: GuestResponseInput, captchaToken?: string) => Promise<GuestSubmitResult>;
    /** Cloudflare Turnstile site key; when set, live submissions carry a bot-check token. */
    turnstileSiteKey?: string | null;
    /** Public reply counts (customer's choice), or null. */
    attendance?: { attending: number; notAttending: number } | null;
    locale?: InvitationLocale;
    /** The "how many of you" control (off for a newborn: guests just reply, owner 2026-11-27). Default on. */
    party?: boolean;
  };
};

const RuntimeContext = createContext<RuntimeValue | null>(null);

function useRuntime(): RuntimeValue {
  const value = useContext(RuntimeContext);
  if (!value) throw new Error('Theme SDK hooks must be used inside the platform runtime');
  return value;
}

/**
 * Platform-owned provider around every theme. Themes never render this;
 * the platform does (see src/components/invitation).
 */
export function InvitationRuntime({
  mode,
  labels,
  musicSrc,
  guest,
  children,
}: RuntimeValue & { children: ReactNode }) {
  const value = useMemo(() => ({ mode, labels, musicSrc, guest }), [mode, labels, musicSrc, guest]);
  return (
    <RuntimeContext.Provider value={value}>
      <MusicProvider src={musicSrc}>{children}</MusicProvider>
    </RuntimeContext.Provider>
  );
}

// ---------------- Music ----------------

type MusicValue = { available: boolean; playing: boolean; start: () => void; prime: () => void; toggle: () => void };
const MusicContext = createContext<MusicValue>({ available: false, playing: false, start: () => {}, prime: () => {}, toggle: () => {} });

/** How long `start()` takes to bring the song in (where the browser lets a page set the volume; iPhones play at full volume). */
const FADE_IN_MS = 1200;

function MusicProvider({ src, children }: { src: string | null; children: ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const resumeOnVisible = useRef(false);
  // Set once the theme asked for sound; a pending `prime()` must then not pause the song again.
  const wanted = useRef(false);

  const ensure = useCallback(() => {
    if (!src) return null;
    if (!audio.current) {
      const a = new Audio(src);
      // Owner requirement: the song always repeats.
      a.loop = true;
      a.preload = 'auto';
      a.addEventListener('play', () => setPlaying(true));
      a.addEventListener('pause', () => setPlaying(false));
      audio.current = a;
    }
    return audio.current;
  }, [src]);

  /**
   * Plays the song. Call it from the guest's tap ("Open invitation"), or later after `prime()` was called
   * from that tap (e.g. when the opening animation ends): phones block sound that no tap allowed.
   */
  const start = useCallback(() => {
    const a = ensure();
    if (!a) return;
    wanted.current = true;
    a.muted = false;
    a.volume = 0;
    const began = performance.now();
    const rise = () => {
      // Stopped mid-fade (the phone locked, the guest paused): it comes back at full volume.
      const t = a.paused ? 1 : Math.min(1, (performance.now() - began) / FADE_IN_MS);
      a.volume = t;
      if (t < 1) requestAnimationFrame(rise);
    };
    a.play().then(() => requestAnimationFrame(rise), () => {
      a.volume = 1;
      setPlaying(false);
    });
  }, [ensure]);

  /**
   * From the guest's tap, when the song should only begin later: unlocks sound for this page without
   * playing anything (a silent, muted start that stops at once). Then call `start()` when the time comes.
   */
  const prime = useCallback(() => {
    const a = ensure();
    if (!a || wanted.current) return;
    a.muted = true;
    a.play().then(
      () => {
        if (wanted.current) return;
        a.pause();
        a.currentTime = 0;
        a.muted = false;
      },
      () => {
        a.muted = false;
      },
    );
  }, [ensure]);

  const toggle = useCallback(() => {
    const a = ensure();
    if (!a) return;
    wanted.current = true;
    a.muted = false;
    a.volume = 1;
    if (a.paused) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [ensure]);

  useEffect(() => {
    // Pause when the phone locks or the guest switches apps; resume when they return.
    const onVisibility = () => {
      const a = audio.current;
      if (!a) return;
      if (document.hidden) {
        resumeOnVisible.current = !a.paused;
        a.pause();
      } else if (resumeOnVisible.current) {
        a.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      audio.current?.pause();
    };
  }, []);

  const value = useMemo(() => ({ available: Boolean(src), playing, start, prime, toggle }), [src, playing, start, prime, toggle]);
  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

/**
 * The invitation's song. `start()` from the "Open invitation" tap, or `prime()` from that tap and `start()` when the
 * opening ends; `toggle()` for the music button. Always loops.
 */
export function useMusic(): MusicValue {
  return useContext(MusicContext);
}

// ---------------- Motion & time ----------------

/** Platform only (not part of the SDK index): the photo editor shows the design already open, without its entrance. */
let forcedReducedMotion = false;
const forcedListeners = new Set<() => void>();
export function setForcedReducedMotion(on: boolean) {
  forcedReducedMotion = on;
  for (const l of forcedListeners) l();
}

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  forcedListeners.add(cb);
  return () => {
    mq.removeEventListener('change', cb);
    forcedListeners.delete(cb);
  };
}

/** True when the visitor asked their device for less motion. Themes must honor it. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => forcedReducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

export type Countdown = { days: number; hours: number; minutes: number; seconds: number; started: boolean };

/** Live countdown to `startsAt`. Null during server render and first paint (avoids hydration mismatch). */
// One shared 1-second clock for every countdown on the page.
const clockListeners = new Set<() => void>();
let clockTimer: number | undefined;
let clockNow = 0;
function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockTimer === undefined) {
    clockNow = Date.now();
    clockTimer = window.setInterval(() => {
      clockNow = Date.now();
      clockListeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    clockListeners.delete(listener);
    if (!clockListeners.size && clockTimer !== undefined) {
      window.clearInterval(clockTimer);
      clockTimer = undefined;
    }
  };
}

export function useCountdown(startsAt: string | null): Countdown | null {
  const now = useSyncExternalStore(
    subscribeClock,
    () => clockNow || Date.now(),
    () => null,
  );
  if (!startsAt || now === null) return null;
  const diff = Math.max(0, new Date(startsAt).getTime() - now);
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    started: diff === 0,
  };
}

export function useInvitationMode(): InvitationMode {
  return useRuntime().mode;
}

// ---------------- Guest form ----------------

export { GUEST_LIMITS };

export type GuestFormApi = {
  /** Package includes the guest form (RSVP). */
  enabled: boolean;
  /** Package includes a congratulation message field. */
  withMessage: boolean;
  status: 'idle' | 'sending' | 'sent' | 'error';
  /** In sample/preview mode nothing is saved; show `labels.sentPreview` after sending. */
  isPreview: boolean;
  fieldErrors: Partial<Record<'name' | 'attendance' | 'message', string>>;
  error: string | null;
  limits: typeof GUEST_LIMITS;
  submit: (input: GuestResponseInput) => Promise<void>;
};

// ---------------- Bot check (Cloudflare Turnstile) ----------------

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScript: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  turnstileScript ??= new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      turnstileScript = null;
      reject(new Error('turnstile'));
    };
    document.head.appendChild(el);
  });
  return turnstileScript;
}

/** Holds the latest Turnstile token for one guest form; filled by `TurnstileBox`. */
class TurnstileHandle {
  private token: string | null = null;
  private widget: string | null = null;

  attach(el: HTMLElement, siteKey: string) {
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        this.widget = window.turnstile.render(el, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          callback: (t: string) => {
            this.token = t;
          },
          'expired-callback': () => {
            this.token = null;
          },
          'error-callback': () => {
            this.token = null;
          },
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (this.widget && window.turnstile) window.turnstile.remove(this.widget);
      this.widget = null;
    };
  }

  /** Waits up to 10 s for a token, then hands it out once and asks for a fresh one. */
  async take(): Promise<string | undefined> {
    for (let i = 0; i < 40 && !this.token; i++) await new Promise((r) => setTimeout(r, 250));
    const t = this.token;
    this.token = null;
    if (this.widget && window.turnstile) window.turnstile.reset(this.widget);
    return t ?? undefined;
  }
}

/** Invisible unless Cloudflare needs the guest to tick a box. */
function TurnstileBox({ handle, siteKey }: { handle: TurnstileHandle; siteKey: string }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => (el ? handle.attach(el, siteKey) : undefined), [el, handle, siteKey]);
  return <div ref={setEl} />;
}

/**
 * Headless guest form. The theme designs the markup; the platform validates,
 * submits, protects against spam and stores responses. Renders nothing when
 * the package has no guest form.
 */
/**
 * How many guests are coming / not coming, when the customer shows it to everyone. Drawn with the
 * theme's own font and colours (everything inherits), so it fits any design.
 */
function AttendanceSummary({ counts, labels, locale }: { counts: { attending: number; notAttending: number }; labels: ThemeLabels; locale: InvitationLocale }) {
  const box = { flex: 1, padding: '0.75em 0.5em', border: '1px solid currentColor', borderRadius: '0.75em', textAlign: 'center' as const };
  return (
    <section aria-label={labels.attendanceTitle} data-bahja-attendance="" style={{ margin: '0 auto 1.25em', maxWidth: '24em', width: '100%' }}>
      <p style={{ margin: '0 0 0.5em', textAlign: 'center', fontWeight: 600 }}>{labels.attendanceTitle}</p>
      <div style={{ display: 'flex', gap: '0.75em' }}>
        <p style={box}>
          <span style={{ display: 'block', fontSize: '1.75em', lineHeight: 1.1, fontWeight: 700 }}>{formatNumber(counts.attending, locale)}</span>
          <span style={{ opacity: 0.85 }}>{labels.attendingCount}</span>
        </p>
        <p style={{ ...box, opacity: 0.8 }}>
          <span style={{ display: 'block', fontSize: '1.75em', lineHeight: 1.1, fontWeight: 700 }}>{formatNumber(counts.notAttending, locale)}</span>
          <span style={{ opacity: 0.85 }}>{labels.notAttendingCount}</span>
        </p>
      </div>
    </section>
  );
}

/**
 * "How many of you?" with − and +: a family that got one link answers once for everyone (owner request,
 * 2026-10-28). Drawn by the platform under every design's name field (see `useHostAfter`), in the design's own
 * font and colours.
 */
function PartySize({ value, onChange, labels, locale }: { value: number; onChange: (n: number) => void; labels: ThemeLabels; locale: InvitationLocale }) {
  const button = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.2em',
    height: '2.2em',
    minHeight: 0,
    padding: 0,
    margin: 0,
    border: '1px solid currentColor',
    borderRadius: '999px',
    background: 'transparent',
    color: 'inherit',
    font: 'inherit',
    fontSize: '1.15em',
    lineHeight: 1,
    cursor: 'pointer',
  } as const;
  return (
    <div role="group" aria-label={labels.partySize} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75em', margin: '0.6em 0' }}>
      <span>{labels.partySize}</span>
      {/* − 1 + reads the same way in every language. */}
      <span dir="ltr" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.7em' }}>
        <button type="button" aria-label={labels.partyFewer} disabled={value <= 1} onClick={() => onChange(value - 1)} style={{ ...button, opacity: value <= 1 ? 0.35 : 1 }}>
          −
        </button>
        <output aria-live="polite" data-bahja-party-size={value} style={{ minWidth: '1.6em', textAlign: 'center', fontWeight: 700, fontSize: '1.2em' }}>
          {formatNumber(value, locale)}
        </output>
        <button
          type="button"
          aria-label={labels.partyMore}
          disabled={value >= GUEST_LIMITS.party}
          onClick={() => onChange(value + 1)}
          style={{ ...button, opacity: value >= GUEST_LIMITS.party ? 0.35 : 1 }}
        >
          +
        </button>
      </span>
    </div>
  );
}

/**
 * A box the platform draws into, placed right after the design's own field (`input[name=name]` for the party size,
 * `textarea[name=message]` for the signature pad), or after the label around it, so every design, frozen versions
 * included, gets it without changes. Follows the form if the design redraws it; gone while the field isn't shown.
 */
function useHostAfter(area: HTMLElement | null, selector: string, attr: string, on = true) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!area || !on) return;
    const box = document.createElement('div');
    box.setAttribute(attr, '');
    const place = () => {
      const field = area.querySelector<HTMLElement>(selector);
      if (!field) {
        box.remove();
        setHost(null);
        return;
      }
      const anchor = field.closest('label') ?? field;
      if (anchor.nextElementSibling !== box) anchor.after(box);
      setHost(box);
    };
    place();
    const watch = new MutationObserver(place);
    watch.observe(area, { childList: true, subtree: true });
    return () => {
      watch.disconnect();
      box.remove();
      setHost(null);
    };
  }, [area, selector, attr, on]);
  return on ? host : null;
}

/** The pad's drawing box in CSS px (its strokes are stored in these units). */
const SIGN_PAD_HEIGHT = 130;

/**
 * "Sign here (optional)": a guest signs under their message with a finger or the mouse (owner, 2026-11-27); the
 * signature goes into the keepsake and the signature board. Drawn by the platform in the design's own font and
 * colours, like the party size. Strokes are kept in the same format as the customer's signature.
 */
function SignaturePadBox({ onChange, labels }: { onChange: (s: GuestSignature | null) => void; labels: ThemeLabels }) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const strokes = useRef<number[][]>([]);
  const start = useRef(0);
  const [empty, setEmpty] = useState(true);

  const fit = useCallback(() => {
    const el = canvas.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    el.width = Math.round(r.width * d);
    el.height = Math.round(r.height * d);
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = getComputedStyle(el).color;
    for (const s of strokes.current) {
      ctx.beginPath();
      for (let i = 0; i < s.length; i += 3) (i ? ctx.lineTo : ctx.moveTo).call(ctx, s[i]!, s[i + 1]!);
      ctx.stroke();
    }
  }, []);
  useEffect(() => {
    fit();
    const watch = new ResizeObserver(fit);
    if (canvas.current) watch.observe(canvas.current);
    return () => watch.disconnect();
  }, [fit]);

  const clear = useCallback(() => {
    strokes.current = [];
    setEmpty(true);
    onChange(null);
    fit();
  }, [fit, onChange]);

  const report = () => {
    const el = canvas.current;
    if (!el || !strokes.current.length) return;
    const r = el.getBoundingClientRect();
    onChange({ w: Math.round(r.width), h: Math.round(r.height), s: strokes.current.map((x) => [...x]) });
  };
  const point = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [Math.round((e.clientX - r.left) * 10) / 10, Math.round((e.clientY - r.top) * 10) / 10] as const;
  };
  const down = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (strokes.current.length >= 60) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (!strokes.current.length) start.current = performance.now();
    const [x, y] = point(e);
    strokes.current.push([x, y, Math.round(performance.now() - start.current)]);
    setEmpty(false);
  };
  const move = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const s = strokes.current[strokes.current.length - 1];
    if (!s) return;
    const [x, y] = point(e);
    const [px, py] = [s[s.length - 3]!, s[s.length - 2]!];
    // Points closer than about a pixel add nothing; a very long drawing stops growing.
    if (Math.hypot(x - px, y - py) < 1.5 || strokes.current.reduce((n, t) => n + t.length, 0) > 8000) return;
    s.push(x, y, Math.round(performance.now() - start.current));
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const up = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    report();
  };

  const small = { border: '1px solid currentColor', borderRadius: '999px', background: 'transparent', color: 'inherit', font: 'inherit', fontSize: '0.85em', padding: '0.2em 0.9em', minHeight: 0, margin: 0, cursor: 'pointer' } as const;
  return (
    <div data-bahja-signature-pad="" style={{ margin: '0.6em 0', display: 'flex', flexDirection: 'column', gap: '0.4em' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75em' }}>
        <span>{labels.signHere}</span>
        {empty ? null : (
          <button type="button" onClick={clear} style={small}>
            {labels.signClear}
          </button>
        )}
      </div>
      <div style={{ position: 'relative', height: SIGN_PAD_HEIGHT, border: '1px dashed currentColor', borderRadius: '0.75em', opacity: 0.95 }}>
        <canvas
          ref={canvas}
          role="img"
          aria-label={labels.signHere}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair', borderRadius: '0.75em' }}
        />
        <span aria-hidden="true" style={{ position: 'absolute', left: '1em', right: '1em', bottom: '1.9em', borderTop: '1px solid currentColor', opacity: 0.25, pointerEvents: 'none' }} />
        {empty ? (
          <span aria-hidden="true" style={{ position: 'absolute', insetInline: 0, bottom: '0.45em', textAlign: 'center', fontSize: '0.8em', opacity: 0.55, pointerEvents: 'none' }}>
            {labels.signHint}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function GuestFormSlot({ render, summary = true }: { render: (form: GuestFormApi) => ReactNode; summary?: boolean }) {
  const { guest, labels, mode } = useRuntime();
  const [status, setStatus] = useState<GuestFormApi['status']>('idle');
  const [fieldErrors, setFieldErrors] = useState<GuestFormApi['fieldErrors']>({});
  const [error, setError] = useState<string | null>(null);
  const isPreview = mode !== 'live';
  const router = useRouter();
  const [bot] = useState(() => new TurnstileHandle());
  const botKey = isPreview ? null : (guest.turnstileSiteKey ?? null);
  const [party, setParty] = useState(1);
  const [signature, setSignature] = useState<GuestSignature | null>(null);
  const [round, setRound] = useState(0);
  const [area, setArea] = useState<HTMLDivElement | null>(null);
  const withParty = guest.party !== false;
  const partyHost = useHostAfter(area, 'input[name="name"]', 'data-bahja-party', withParty);
  const signHost = useHostAfter(area, 'textarea[name="message"]', 'data-bahja-sign', guest.withMessage);

  const submit = useCallback(
    async (input: GuestResponseInput) => {
      const name = input.name.trim();
      const message = input.message?.trim() ?? '';
      const errors: GuestFormApi['fieldErrors'] = {};
      if (!name) errors.name = labels.errorRequired;
      else if (name.length > GUEST_LIMITS.name) errors.name = labels.errorTooLong;
      if (!input.attendance) errors.attendance = labels.errorRequired;
      if (guest.withMessage) {
        if (!message) errors.message = labels.errorRequired;
        else if (message.length > GUEST_LIMITS.message) errors.message = labels.errorTooLong;
      }
      setFieldErrors(errors);
      setError(null);
      if (Object.keys(errors).length) return;

      setStatus('sending');
      if (isPreview || !guest.submit) {
        // Sample/preview: nothing is stored (server-side rules also reject unpublished invitations).
        await new Promise((r) => setTimeout(r, 400));
        setStatus('sent');
        return;
      }
      const captcha = botKey ? await bot.take() : undefined;
      const partySize = withParty ? (input.partySize ?? party) : 1;
      const signed = guest.withMessage ? (input.signature ?? signature) : null;
      const result = await guest.submit({ name, attendance: input.attendance, message: guest.withMessage ? message : undefined, partySize, signature: signed }, captcha).catch(
        () => ({ ok: false, error: 'failed' }) as const,
      );
      if (result.ok) {
        // The next guest on a shared phone signs for themselves: the pad starts blank again.
        setSignature(null);
        setRound((n) => n + 1);
        setStatus('sent');
        // Re-render the invitation so a public guest messages list shows the new message.
        router.refresh();
      }
      else {
        setStatus('error');
        setError(labels.errorGeneric);
      }
    },
    [guest, labels, isPreview, bot, botKey, router, party, withParty, signature],
  );

  if (!guest.enabled) return null;
  return (
    <>
      {summary && guest.attendance ? <AttendanceSummary counts={guest.attendance} labels={labels} locale={guest.locale ?? 'ar'} /> : null}
      {/* `display: contents`: the design lays its form out as if this box weren't there. */}
      <div ref={setArea} style={{ display: 'contents' }}>
        {render({ enabled: true, withMessage: guest.withMessage, status, isPreview, fieldErrors, error, limits: GUEST_LIMITS, submit })}
      </div>
      {partyHost ? createPortal(<PartySize value={party} onChange={setParty} labels={labels} locale={guest.locale ?? 'ar'} />, partyHost) : null}
      {signHost ? createPortal(<SignaturePadBox key={round} onChange={setSignature} labels={labels} />, signHost) : null}
      {botKey ? <TurnstileBox handle={bot} siteKey={botKey} /> : null}
    </>
  );
}

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { GuestResponseInput, GuestSubmitResult, InvitationMode, ThemeLabels } from './types';

type RuntimeValue = {
  mode: InvitationMode;
  labels: ThemeLabels;
  musicSrc: string | null;
  guest: { enabled: boolean; withMessage: boolean; submit?: (input: GuestResponseInput) => Promise<GuestSubmitResult> };
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

type MusicValue = { available: boolean; playing: boolean; start: () => void; toggle: () => void };
const MusicContext = createContext<MusicValue>({ available: false, playing: false, start: () => {}, toggle: () => {} });

function MusicProvider({ src, children }: { src: string | null; children: ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const resumeOnVisible = useRef(false);

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

  /** Must be called from a user gesture (e.g. "Open invitation"): mobile browsers block autoplay otherwise. */
  const start = useCallback(() => {
    ensure()?.play().catch(() => setPlaying(false));
  }, [ensure]);

  const toggle = useCallback(() => {
    const a = ensure();
    if (!a) return;
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

  const value = useMemo(() => ({ available: Boolean(src), playing, start, toggle }), [src, playing, start, toggle]);
  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

/** The invitation's song. `start()` from the "Open invitation" tap; `toggle()` for the music button. Always loops. */
export function useMusic(): MusicValue {
  return useContext(MusicContext);
}

// ---------------- Motion & time ----------------

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/** True when the visitor asked their device for less motion. Themes must honor it. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
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

export const GUEST_LIMITS = { name: 80, message: 500 } as const;

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

/**
 * Headless guest form. The theme designs the markup; the platform validates,
 * submits, protects against spam and stores responses. Renders nothing when
 * the package has no guest form.
 */
export function GuestFormSlot({ render }: { render: (form: GuestFormApi) => ReactNode }) {
  const { guest, labels, mode } = useRuntime();
  const [status, setStatus] = useState<GuestFormApi['status']>('idle');
  const [fieldErrors, setFieldErrors] = useState<GuestFormApi['fieldErrors']>({});
  const [error, setError] = useState<string | null>(null);
  const isPreview = mode !== 'live';

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
      const result = await guest.submit({ name, attendance: input.attendance, message: guest.withMessage ? message : undefined }).catch(
        () => ({ ok: false, error: 'failed' }) as const,
      );
      if (result.ok) setStatus('sent');
      else {
        setStatus('error');
        setError(labels.errorGeneric);
      }
    },
    [guest, labels, isPreview],
  );

  if (!guest.enabled) return null;
  return <>{render({ enabled: true, withMessage: guest.withMessage, status, isPreview, fieldErrors, error, limits: GUEST_LIMITS, submit })}</>;
}

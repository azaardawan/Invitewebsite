'use client';

/**
 * The Theme Contract's runtime side (docs/ARCHITECTURE_PROPOSAL.md §6).
 *
 * Themes are presentation only: they receive one `ThemeProps` object and use
 * these hooks/components for anything that needs platform behaviour (audio,
 * the guest form, motion preferences, localized dates). Nothing here talks to
 * the network directly; guest responses go through the submit handler the
 * platform provides via `ThemeRuntimeProvider`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from 'react';
import type { FeatureKey } from '@/catalog/features';
import type { FieldKey } from '@/catalog/fields';
import type { ThemeLocale } from './format';

export type { ThemeLocale } from './format';
export { eventInstant, formatEventDate, formatEventTime, formatNumber } from './format';

export type ThemeMode = 'sample' | 'preview' | 'live';

export type ThemeProps = {
  /** `sample`/`preview` render with inert forms; only `live` submits guest responses. */
  mode: ThemeMode;
  locale: ThemeLocale;
  dir: 'rtl' | 'ltr';
  /** Validated plain-text values of the package's fields. Absent = not in this package. */
  fields: Readonly<Partial<Record<FieldKey, string>>>;
  /** Features included in this package. */
  features: readonly FeatureKey[];
  /** Localized platform strings (field labels etc.), keyed by the platform. */
  labels: Readonly<Record<string, string>>;
  /** The invitation's song, if one is configured. It always loops. */
  music: { src: string } | null;
};

// ---------------------------------------------------------------------------
// Motion preference
// ---------------------------------------------------------------------------

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia(reducedMotionQuery);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

/** True when the guest asked their device for less motion. False during SSR. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

// ---------------------------------------------------------------------------
// Music
// ---------------------------------------------------------------------------

export type MusicControls = {
  /** False when the package has no music or no song is configured. */
  available: boolean;
  playing: boolean;
  /** Call from the "Open invitation" tap: phones only allow audio after a gesture. */
  start: () => void;
  toggle: () => void;
};

/** Plays the invitation's song. Looping is always on (owner requirement). */
export function useMusic(music: ThemeProps['music']): MusicControls {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const src = music?.src ?? null;

  useEffect(
    () => () => {
      audio.current?.pause();
      audio.current = null;
    },
    [src],
  );

  const play = useCallback(() => {
    if (!src) return;
    if (!audio.current) {
      audio.current = new Audio(src);
      audio.current.loop = true;
      audio.current.preload = 'auto';
    }
    audio.current.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, [src]);

  const toggle = useCallback(() => {
    if (audio.current && !audio.current.paused) {
      audio.current.pause();
      setPlaying(false);
    } else {
      play();
    }
  }, [play]);

  return { available: src !== null, playing, start: play, toggle };
}

export type Countdown = { days: number; hours: number; minutes: number; done: boolean };

function countdownTo(target: Date, now: number): Countdown {
  const ms = Math.max(0, target.getTime() - now);
  const minutes = Math.floor(ms / 60_000);
  return { days: Math.floor(minutes / 1440), hours: Math.floor((minutes % 1440) / 60), minutes: minutes % 60, done: ms === 0 };
}

/**
 * Time left until the event, refreshed every 30 s (minute precision, so the
 * page never has a ticking seconds counter). Null during SSR and before hydration.
 */
export function useCountdown(target: Date | null): Countdown | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return target && now !== null ? countdownTo(target, now) : null;
}

// ---------------------------------------------------------------------------
// Guest form (headless)
// ---------------------------------------------------------------------------

export type GuestResponse = { guestName: string; attending: boolean; message?: string };
export type GuestSubmitResult = { ok: true } | { ok: false; fieldErrors?: GuestFieldErrors; formError?: 'failed' | 'closed' | 'rate_limited' };
export type GuestField = 'guestName' | 'attending' | 'message';
export type GuestFieldError = 'required' | 'too_long';
export type GuestFieldErrors = Partial<Record<GuestField, GuestFieldError>>;

type Runtime = { submitGuestResponse?: (response: GuestResponse) => Promise<GuestSubmitResult> };
const RuntimeContext = createContext<Runtime>({});

/** Platform-side: supplies the live submit handler (server action) for `mode: 'live'`. */
export function ThemeRuntimeProvider({ children, ...runtime }: Runtime & { children: ReactNode }) {
  return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>;
}

export const GUEST_LIMITS = { guestName: 60, message: 500 } as const;

export type GuestFormApi = {
  values: { guestName: string; attending: boolean | null; message: string };
  setGuestName: (v: string) => void;
  setAttending: (v: boolean) => void;
  setMessage: (v: string) => void;
  /** Whether this package includes the message to the couple. */
  includeMessage: boolean;
  limits: typeof GUEST_LIMITS;
  errors: GuestFieldErrors;
  status: 'idle' | 'sending' | 'success' | 'error';
  formError: 'failed' | 'closed' | 'rate_limited' | null;
  /** Pass to `<form onSubmit>`. */
  onSubmit: (e?: FormEvent) => void;
};

function validate(v: GuestFormApi['values'], includeMessage: boolean): GuestFieldErrors {
  const errors: GuestFieldErrors = {};
  const name = v.guestName.trim();
  if (!name) errors.guestName = 'required';
  else if (name.length > GUEST_LIMITS.guestName) errors.guestName = 'too_long';
  if (v.attending === null) errors.attending = 'required';
  if (includeMessage && v.message.trim().length > GUEST_LIMITS.message) errors.message = 'too_long';
  return errors;
}

/**
 * Headless guest form: the theme supplies all markup and styling through
 * `render`; state, validation and submission belong to the platform. In
 * `sample`/`preview` mode nothing is sent (the success state is simulated).
 */
export function GuestFormSlot({
  mode,
  features,
  render,
}: {
  mode: ThemeMode;
  features: readonly FeatureKey[];
  render: (api: GuestFormApi) => ReactNode;
}) {
  const { submitGuestResponse } = useContext(RuntimeContext);
  const includeMessage = features.includes('congratulations');
  const [values, setValues] = useState<GuestFormApi['values']>({ guestName: '', attending: null, message: '' });
  const [errors, setErrors] = useState<GuestFieldErrors>({});
  const [status, setStatus] = useState<GuestFormApi['status']>('idle');
  const [formError, setFormError] = useState<GuestFormApi['formError']>(null);

  const clear = (field: GuestField) => setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));

  const onSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (status === 'sending' || status === 'success') return;
    const found = validate(values, includeMessage);
    setErrors(found);
    setFormError(null);
    if (Object.values(found).some(Boolean)) return;
    setStatus('sending');
    const response: GuestResponse = {
      guestName: values.guestName.trim(),
      attending: values.attending === true,
      ...(includeMessage && values.message.trim() ? { message: values.message.trim() } : {}),
    };
    const result: GuestSubmitResult =
      mode === 'live' && submitGuestResponse
        ? await submitGuestResponse(response).catch(() => ({ ok: false as const, formError: 'failed' as const }))
        : await new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 900));
    if (result.ok) {
      setStatus('success');
    } else {
      setErrors(result.fieldErrors ?? {});
      setFormError(result.formError ?? null);
      setStatus('error');
    }
  };

  return render({
    values,
    setGuestName: (v) => {
      setValues((s) => ({ ...s, guestName: v }));
      clear('guestName');
    },
    setAttending: (v) => {
      setValues((s) => ({ ...s, attending: v }));
      clear('attending');
    },
    setMessage: (v) => {
      setValues((s) => ({ ...s, message: v }));
      clear('message');
    },
    includeMessage,
    limits: GUEST_LIMITS,
    errors,
    status,
    formError,
    onSubmit: (e) => void onSubmit(e),
  });
}

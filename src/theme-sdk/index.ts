/**
 * The Theme SDK: the ONLY platform module a theme may import (plus
 * `@/catalog/*` constants). See docs/THEME_CONTRACT.md.
 */
export type {
  ThemeProps,
  ThemeLabels,
  ThemeComponent,
  InvitationMode,
  InvitationLocale,
  EventDateParts,
  GuestAttendance,
  GuestResponseInput,
} from './types';
export { hasFeature, formatNumber } from './types';
export { useMusic, useReducedMotion, useCountdown, useInvitationMode, GuestFormSlot, GUEST_LIMITS } from './runtime';
export type { GuestFormApi, Countdown } from './runtime';

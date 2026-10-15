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
  BirthDateParts,
  GuestAttendance,
  GuestResponseInput,
  GuestbookMessage,
} from './types';
export { hasFeature, formatNumber } from './types';
export { ThemeBorder, Signature } from './border';
export type { ThemeBorderSpec, BorderKind } from './border';
export type { PrintCardProps, PrintCardBackProps, PrintShapeProps, KeepsakeProps, KeepsakeMessage, PrintLabels, PrintExtraProps } from './print';
export { useMusic, useReducedMotion, useCountdown, useInvitationMode, GuestFormSlot, GUEST_LIMITS } from './runtime';
export type { GuestFormApi, Countdown } from './runtime';

/** An `initials` field's two boxes (e.g. the seal's letters): `{ first, second, whole }`. */
export { splitInitials } from '@/catalog/fields';

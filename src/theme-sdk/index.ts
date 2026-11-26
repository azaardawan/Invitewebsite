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
  ThemePhoto,
  ThemeVideo,
} from './types';
export { hasFeature, formatNumber } from './types';
export { ThemeBorder, Signature } from './border';
export { Photo } from './photo';
export { EditableText, PhotoSlot, VideoSlot, useTemplateEditing } from './editing';
export { Collage, COLLAGES } from './collage';
export { Gallery3D, webglAvailable, useTouchScreen } from './gallery3d/Gallery3D';
export type { Gallery3DHandle, Gallery3DProps } from './gallery3d/Gallery3D';
export type { GalleryPlan, GalleryRoom, GalleryDoor } from './gallery3d/plan';
export { World3D } from './world3d/World3D';
export type { World3DHandle, World3DProps, WorldTap, WorldLook } from './world3d/World3D';
export type { WorldPlan, WorldSurface, WorldRoom, WorldThing, WorldText, Rect, Box, DrawerBuild } from './world3d/plan';
export type { CollageKind, CollageText, CollageFonts, PrintCollageProps } from './collage';
export type { ThemeBorderSpec, BorderKind } from './border';
export type { PhotoSpec } from './manifest';
export { ATTACHED_PHOTO_PLACE } from './places';
export type { PrintPosterProps } from './poster';
export type { PrintCardProps, PrintCardBackProps, PrintShapeProps, KeepsakeProps, KeepsakeMessage, PrintLabels, PrintExtraProps } from './print';
export { useMusic, useReducedMotion, useCountdown, useInvitationMode, GuestFormSlot, GUEST_LIMITS } from './runtime';
export type { GuestFormApi, Countdown } from './runtime';

/** An `initials` field's two boxes (e.g. the seal's letters): `{ first, second, whole }`. */
export { splitInitials } from '@/catalog/fields';
/** What a wedding or engagement is held as (`ThemeProps.eventWording`): a Nishani, a henna night or the couple's own words. */
export type { EventWords } from '@/catalog/occasion-wording';

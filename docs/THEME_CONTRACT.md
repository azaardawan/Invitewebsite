# Theme Contract (for whoever codes a theme)

The owner-facing design workflow is `docs/THEME_GUIDE.md`. This document is the technical contract a
theme's **code** must follow. The platform enforces most of it automatically.

## 1. Folder

```
themes/<key>/v<N>/
├─ manifest.ts        what the theme supports (defineTheme)
├─ Theme.tsx          'use client' default export: (props: ThemeProps) => JSX
├─ theme.module.css   styles: CSS Modules only
├─ print/Card.tsx     printable card (required when the manifest has print.card)
├─ print/Keepsake.tsx keepsake PDF (required when the manifest has print.keepsake)
└─ assets/            optimized WebP/SVG/MP4… imported by relative path
```

- **Adding a theme means adding this folder and nothing else.** The registry is generated automatically
  on `dev`, `build`, `test` and `lint`.
- New versions go in a new folder (`v2`). A version that has ever been **activated is frozen**. Its
  manifest can't change (seeding reports a conflict), and existing invitations keep using it.

## 2. Manifest (`defineTheme`)

- `key` and `version` must match the folder.
- `sections`: where it belongs. `fields` and `features`: what the complete theme renders.
- **`validStates`**: example package combinations the designer drew (previewed and tested). The complete
  theme must be one of them. Admin builds packages from **any** combination of the theme's `features`
  and `fields` (dependencies checked), so the theme must render correctly with any subset.
- `print` companions are required when `print_card` / `keepsake_pdf` are listed, and the registry
  generator fails if the declared `print/Card.tsx` / `print/Keepsake.tsx` file is missing.
- `internal: true` marks a demo theme that can never be sold outside development.

## 3. What the theme receives: `ThemeProps`

Defined in `src/theme-sdk/types.ts`. The data is already validated, filtered to the package, and localized.

| Prop | Meaning |
|---|---|
| `mode` | `sample` / `preview` / `live` |
| `locale`, `dir`, `lang` | Invitation language (independent of the website language) |
| `fields` | Only the fields the package includes. Absent means don't render it. |
| `features` | Only the features the package includes. Use `hasFeature(props, 'map')`. |
| `labels` | Every UI string a theme may show, including `and` (the word between two names). **Never hard-code text**, not even "&". |
| `event.startsAt` / `event.date` / `event.time` | Countdown target (Baghdad time) and localized date/time parts |
| `mapUrl` | A safe map link or null |
| `music` | `{ src }` or null |
| `guestbook` | Guest messages to show **under the invitation**, newest first (`{ guestName, message }[]`, possibly empty) when the customer made them public; `null` when they stay private (keepsake only) or the package has no messages. Render nothing when null; show `labels.guestbookEmpty` when empty. Samples are filled in previews. |

## 4. What the theme may use: `@/theme-sdk`

| API | Use |
|---|---|
| `useMusic()` | `start()` from the "Open invitation" tap (phones block autoplay otherwise); `toggle()` for the music button; `playing`, `available`. **Music always loops.** It pauses automatically when the phone locks. |
| `GuestFormSlot` | Headless guest form. The theme designs it; the platform validates, submits and stores. Nothing is saved in sample/preview. Renders nothing when the package lacks `rsvp`. |
| `useCountdown(startsAt)` | Live countdown (shared 1-second clock) |
| `useReducedMotion()` | Must be honored: replace big motion with simple fades or none |
| `formatNumber(n, locale)` | Arabic-Indic digits for Arabic/Kurdish |

## 4A. Opening animation (required for sellable themes)

Every non-internal theme starts on a cover with a button labelled `labels.openInvitation`. Its click handler
calls `useMusic().start()` and plays the opening animation (CSS `@keyframes`/transitions on `transform` and
`opacity`; optionally a Lottie or a small muted inline video layer). The opening finishes within **4 s**
(looping idle effects are allowed). When `useReducedMotion()` is true, the cover fades and the invitation is
visible within **1 s**. `e2e/themes.spec.ts` enforces all three.

## 5. Rules (enforced)

| Rule | Enforced by |
|---|---|
| Import only `@/theme-sdk`, `@/catalog`, React/Next UI and npm UI libraries; never platform internals, the database, `next/headers`, Node APIs or other themes | ESLint (fails CI) |
| No `dangerouslySetInnerHTML` | ESLint |
| CSS Modules only; no `:global`, `:root`, `html`, `body` | Registry generator (fails dev/build/CI) |
| Renders every designed state at 360/390/430/1280 px in all 4 languages with short and long names, with no errors and no sideways scrolling | `e2e/themes.spec.ts` (fails CI; saves screenshots) |
| Features absent from a package are really absent (map, guest form) | `e2e/themes.spec.ts` |
| Looks right with each feature switched off on its own (any package combination) | `e2e/themes.spec.ts` |
| Opens with an animation after tapping "Open", finished within 4 s; reduced motion shows the invitation within 1 s | `e2e/themes.spec.ts` |
| Loads no platform styles and no other theme's code or styles | `e2e/themes.spec.ts` + per-theme lazy loading |
| A crash only affects that invitation | Platform error boundary |
| The PREVIEW/SAMPLE label can't be removed | Rendered by the platform outside the theme |

Performance budgets (JS/image size) are reported during M11 hardening.

## 6. Print companions

`print/Card.tsx` and `print/Keepsake.tsx` default-export **server components** (no hooks, no
animation, no fetching) receiving `PrintCardProps` / `KeepsakeProps` from `@/theme-sdk`:

- `fields`, `event.date` / `event.time` (localized), `locale`, `dir`, `lang`;
- `labels` (`date`, `time`, `venue`, `and`, `scanToOpen`, `keepsakeTitle`, `keepsakeEmpty`); never hard-code text;
- the card gets `qrDataUrl` (null when `print.card.qr` is false or the team hid it) and `extraLine`
  (one line the team added, or null); the keepsake gets the visible
  `messages` in order (from none to several hundred: let them flow and use `break-inside: avoid`).

The platform sets `@page` from the manifest: the card page is the trim size plus `bleedMm` on every
side (A5 + 3 mm = 154 × 216 mm) so the card's root fills exactly that box; the customer's PDF is exactly
A5 with the bleed cropped evenly (the print-shop version keeps it), so keep text inside the 5 mm safe
area. The keepsake is A4: the first page (the cover) has no margin, so the cover section should fill
210 × 297 mm and end with `break-after: page`; the following pages have 18 / 16 / 20 mm margins and a
page number added by the platform. Use physical units and `print-color-adjust: exact`. Chromium renders
it, so the theme's own fonts and Arabic/Kurdish shaping come out as on screen.

## 7. Preview and review

- Admin → Themes → theme → **Preview**: pick a package or state, language, name length and width.
  It renders in an isolated iframe.
- Direct URL: `/admin/preview/<lang>/theme/<key>?v=<version>&state=<n>&names=short|long`.
- CI uploads every screenshot as the `theme-screenshots` artifact, so the owner can compare them with the design.

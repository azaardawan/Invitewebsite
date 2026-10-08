# Theme Contract (for whoever codes a theme)

The owner-facing design workflow is `docs/THEME_GUIDE.md`. This document is the technical contract a
theme's **code** must follow. The platform enforces most of it automatically.

## 1. Folder

```
themes/<key>/v<N>/
├─ manifest.ts        what the theme supports (defineTheme)
├─ Theme.tsx          'use client' default export: (props: ThemeProps) => JSX
├─ theme.module.css   styles: CSS Modules only
├─ print/Card.tsx     printable card, front (required when the manifest has print.card)
├─ print/CardBack.tsx printable card, back (optional; without it the platform prints a simple back)
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
| `attendance` | How many guests replied coming / not coming (`{ attending, notAttending }`) when the customer chose to show it; `null` otherwise. `GuestFormSlot` already draws it above the form in the theme's own font and colours (`labels.attendanceTitle`, `attendingCount`, `notAttendingCount`); a theme that draws its own passes `summary={false}` to `GuestFormSlot`. |
| `signatures` | The customer's drawn signatures (`{ src }[]`, dark ink on transparent) for packages with `signature`, when they chose to include them: **one, or two** side by side (the customer chooses, e.g. both of the couple). Empty otherwise. Place them where your design has its signature spot with `<Signature signatures={props.signatures} className={…} />` (renders nothing when empty; one or two images side by side; on a dark design invert them with CSS). Leave room for two. Samples show one example signature. Only list `signature` in the manifest when the design has that spot. |
| `colors` | The theme's colour slots (manifest `colors.slots`) with the customer's chosen colour set or the defaults. The platform also sets them as CSS variables `--bahja-color-<key>` around the theme (and around print companions), so CSS writes `var(--bahja-color-accent, #c9a45c)`. Required for `color_choice`; the owner makes the colour sets in Admin. |

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

## 4B. One border for invitation, card and keepsake (required for sellable themes)

Each theme exports one `ThemeBorderSpec` (`{ kind: 'strips' | 'corners', src, size, inset? }`, usually in
`border.ts` with the artwork imported from `assets/`) and renders it with `<ThemeBorder>` from `@/theme-sdk`:

- invitation: `<ThemeBorder border={props.border} fallback={MY_BORDER} medium="screen" />` inside the
  positioned page/column element;
- `print/Card.tsx` and `print/Keepsake.tsx`: the same, with `border={props.border}` and `medium="print"` (it is
  `position: fixed` in print, so it repeats on every keepsake page).

`props.border` is the owner's replacement from Admin → Themes → Border (or null): never ignore it, and never
let the layout depend on the border's exact artwork. `size` is px on a 390 px phone; print uses 0.25 mm per px.
`e2e/themes.spec.ts` checks the border is present on the invitation.

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
| One border via `<ThemeBorder>` on the invitation (and on the card and keepsake) | `e2e/themes.spec.ts` + print review |
| Loads no platform styles and no other theme's code or styles | `e2e/themes.spec.ts` + per-theme lazy loading |
| A crash only affects that invitation | Platform error boundary |
| The PREVIEW/SAMPLE label can't be removed | Rendered by the platform outside the theme |

Performance budgets (JS/image size) are reported during M11 hardening.

## 6. Print companions

Every printable card is **two pages**: the front (`print/Card.tsx`, **portrait**) and the back
(`print/CardBack.tsx`, `PrintCardBackProps`, **landscape**: A5 turned sideways, 210 × 148 mm, drawn at
216 × 154 mm with the 3 mm bleed): the same theme, its own layout. The back gets the customer's big `title`
(or a default such as "With love"), their smaller `message` (or null), and `signatures`/`fields` for a closing
(the signatures, or the names). Each side is printed on its own and the two are joined, so the `<ThemeBorder>`
you draw on the front also frames the landscape back, laid out for its shape. Without a `CardBack.tsx` the
platform prints a simple landscape back (title, message, names or signatures, in the theme's colours). The
customer sees both sides on their receipt and can turn the card over. See `themes/demo-wedding/v1/print/CardBack.tsx`.

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
210 × 297 mm and end with `break-after: page`. Every keepsake page has **no page margin** (so the border sits
in the same place on every page): give the messages section its own padding (about 20 mm top and bottom,
clear of the border at the sides) with `box-decoration-break: clone` so it repeats on each page. No page
numbers are printed. Use physical units and `print-color-adjust: exact`. Chromium renders
it, so the theme's own fonts and Arabic/Kurdish shaping come out as on screen.

## 7. Preview and review

- Admin → Themes → theme → **Preview**: pick a package or state, language, name length and width.
  It renders in an isolated iframe.
- Direct URL: `/admin/preview/<lang>/theme/<key>?v=<version>&state=<n>&names=short|long`.
- CI uploads every screenshot as the `theme-screenshots` artifact, so the owner can compare them with the design.

# Theme Contract (for whoever codes a theme)

The owner-facing design workflow is `docs/THEME_GUIDE.md`. This document is the technical contract a
theme's **code** must follow. The platform enforces most of it automatically.

## 1. Folder

```
themes/<key>/v<N>/
├─ manifest.ts        what the theme supports (defineTheme)
├─ Theme.tsx          'use client' default export: (props: ThemeProps) => JSX
├─ theme.module.css   styles: CSS Modules only
└─ assets/            optimized WebP/SVG/MP4… imported by relative path
```

- **Adding a theme means adding this folder and nothing else.** The registry is generated automatically
  on `dev`, `build`, `test` and `lint`.
- New versions go in a new folder (`v2`). A version that has ever been **activated is frozen**. Its
  manifest can't change (seeding reports a conflict), and existing invitations keep using it.

## 2. Manifest (`defineTheme`)

- `key` and `version` must match the folder.
- `sections`: where it belongs. `fields` and `features`: what the complete theme renders.
- **`validStates`**: the package combinations the designer actually designed. The complete theme
  must be one of them. Admin can only create packages matching a state.
- `print` companions are required when `print_card` / `keepsake_pdf` are listed. The companions
  themselves arrive with M8.
- `internal: true` marks a demo theme that can never be sold outside development.

## 3. What the theme receives: `ThemeProps`

Defined in `src/theme-sdk/types.ts`. The data is already validated, filtered to the package, and localized.

| Prop | Meaning |
|---|---|
| `mode` | `sample` / `preview` / `live` |
| `locale`, `dir`, `lang` | Invitation language (independent of the website language) |
| `fields` | Only the fields the package includes. Absent means don't render it. |
| `features` | Only the features the package includes. Use `hasFeature(props, 'map')`. |
| `labels` | Every UI string a theme may show. **Never hard-code text.** |
| `event.startsAt` / `event.date` / `event.time` | Countdown target (Baghdad time) and localized date/time parts |
| `mapUrl` | A safe map link or null |
| `music` | `{ src }` or null |

## 4. What the theme may use: `@/theme-sdk`

| API | Use |
|---|---|
| `useMusic()` | `start()` from the "Open invitation" tap (phones block autoplay otherwise); `toggle()` for the music button; `playing`, `available`. **Music always loops.** It pauses automatically when the phone locks. |
| `GuestFormSlot` | Headless guest form. The theme designs it; the platform validates, submits and stores. Nothing is saved in sample/preview. Renders nothing when the package lacks `rsvp`. |
| `useCountdown(startsAt)` | Live countdown (shared 1-second clock) |
| `useReducedMotion()` | Must be honored: replace big motion with simple fades or none |
| `formatNumber(n, locale)` | Arabic-Indic digits for Arabic/Kurdish |

## 5. Rules (enforced)

| Rule | Enforced by |
|---|---|
| Import only `@/theme-sdk`, `@/catalog`, React/Next UI and npm UI libraries; never platform internals, the database, `next/headers`, Node APIs or other themes | ESLint (fails CI) |
| No `dangerouslySetInnerHTML` | ESLint |
| CSS Modules only; no `:global`, `:root`, `html`, `body` | Registry generator (fails dev/build/CI) |
| Renders every designed state at 360/390/430/1280 px in all 4 languages with short and long names, with no errors and no sideways scrolling | `e2e/themes.spec.ts` (fails CI; saves screenshots) |
| Features absent from a package are really absent (map, guest form) | `e2e/themes.spec.ts` |
| Loads no platform styles and no other theme's code or styles | `e2e/themes.spec.ts` + per-theme lazy loading |
| A crash only affects that invitation | Platform error boundary |
| The PREVIEW/SAMPLE label can't be removed | Rendered by the platform outside the theme |

Performance budgets (JS/image size) are reported during M11 hardening.

## 6. Preview and review

- Admin → Themes → theme → **Preview**: pick a package or state, language, name length and width.
  It renders in an isolated iframe.
- Direct URL: `/admin/preview/<lang>/theme/<key>?v=<version>&state=<n>&names=short|long`.
- CI uploads every screenshot as the `theme-screenshots` artifact, so the owner can compare them with the design.

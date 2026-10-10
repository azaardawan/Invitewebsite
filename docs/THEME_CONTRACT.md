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

## 7. Design kits (`experience: 'DESIGN_KIT'`)

A design kit sells downloadable files instead of an online invitation. Same folder rules, but the
component is **`Kit.tsx`** (default export `(props: KitProps) => JSX`) instead of `Theme.tsx`.

```ts
export default defineTheme({
  key: 'my-kit', version: 1, title: { ar: '…', en: '…' },
  experience: 'DESIGN_KIT',
  sections: ['baby'],
  fields: ['baby_name', 'father_name', 'birth_date'],
  features: ['kit_story', 'kit_card', 'kit_sticker', 'kit_bottle'], // kit_* only
  validStates: kitStates(features, fields), // every non-empty mix is a valid package
});
```

**What the kit draws.** One *unit* at a time: `story`, `card`, `sticker-round`, `sticker-square`,
`bottle` (`props.unit`). The platform does everything else: sizes, print sheets (15 stickers per A4,
bottle wraps on A4 landscape), crop marks and cut guides, PNG/PDF files, the preview gallery and its
watermark. Sizes are in `src/catalog/kit.ts`.

**`KitProps`** (`src/theme-sdk/types.ts`):

| Prop | Meaning |
|---|---|
| `unit`, `size` | Which design, and its box in CSS px **including bleed** (`size.bleed`, `size.safe`, `size.overlap`, `size.shape`) |
| `fields` | The package's fields (plain text). Don't print `birth_date` yourself: |
| `birthDate` | the date already written in the customer's chosen style (1 line, or 2 for Gregorian + Hijri) |
| `copy` | The theme's changeable wording in the kit language, from `kitCopy.<theme key>` in `src/i18n/messages/*.json` |
| `locale`, `dir`, `lang`, `mode` | As for invitations |

**Rules (in addition to §5):**
- The unit's element is a **size container**: lay out with `cqw`/`cqh`, never fixed pixels, so the
  same design prints at any size. `--kit-bleed`, `--kit-safe` and `--kit-overlap` are set on it.
- Art fills the bleed; **text stays inside the trim** (and the safe area). The bottle wrap's glued
  strip (`--kit-overlap`, at the right edge) stays plain.
- Long names must fit: scale the name down by its length. `e2e/kits.spec.ts` fails if any text leaves its unit.
- Use `next/image` with `unoptimized` for art (files are printed at full resolution) and bundle fonts
  in the theme folder with `@font-face` (they must cover ڕ ۆ ێ ڵ ە ڤ).
- Text that may need changing later goes in `kitCopy`, not in the frozen folder. Fixed religious text
  the owner wants always in Arabic may live in the theme (mark it `lang="ar" dir="rtl"`).
- Validation: `e2e/kits.spec.ts` renders every unit in all languages, short and long names, at every width.

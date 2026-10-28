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
- `sections`: where it belongs (the first is its main occasion; a design whose wording fits several lists them all and reads `props.occasion`). `fields` and `features`: what the complete theme renders.
- **`validStates`**: example package combinations the designer drew (previewed and tested). The complete
  theme must be one of them. Admin builds packages from **any** combination of the theme's `features`
  and `fields` (dependencies checked), so the theme must render correctly with any subset.
- `optionalFields`: fields of the design the customer may leave empty (besides the Field Library's optional ones),
  e.g. a birthday's venue. Every other field the package includes is required; the design must look right without them.
- `print` companions are required when `print_card` / `keepsake_pdf` are listed, and the registry
  generator fails if the declared `print/Card.tsx` / `print/Keepsake.tsx` file is missing.
- `internal: true` marks a demo theme that can never be sold outside development.
- `title`, `wording[].label` and `print.shapes[].label` may also carry `ckb` / `bdn`, only with Kurdish the owner
  approved in `docs/translations/KURDISH_REVIEW.md`; without it the Kurdish pages show the Arabic. The title's
  Kurdish becomes the design's Kurdish name when it is first registered (the owner can change it in Admin).
- `wording`: lines of the design's own text the customer may change on the order form (never Quran or du'a),
  each `{ key, label: {ar, en, ckb?, bdn?}, ar, versions?: {en?, ckb?, bdn?}, defaultIn?, maxLength }`. The Arabic is the
  default, except in the languages listed in `defaultIn` (their version is); a version is offered as a choice
  for orders in that language; or the customer writes their own. The theme prints `props.wording[key]` (always filled). Kurdish versions need the owner's approval.
  A line may add `options` (fixed alternatives offered after the Arabic, e.g. «ثاني / ثالث») and `custom: false`
  (no own text: only the offered choices).
- `switches`: yes/no questions for the customer on the order form, each `{ key, label: {ar, en}, default }`
  (e.g. "show the father's name on the stickers"). The theme reads `props.switches[key]` (always filled).
- `onlineInvitation: false` marks a **files-only** design (e.g. a newborn set: story, card, stickers,
  bottle label). It has no online invitation: no `/i/` page (404), no link or QR on the receipt or card,
  and the storefront shows it as a picture, not in a phone frame. `Theme.tsx` is then only the preview.

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
| `signatures` | The customer's drawn signatures (`{ src }[]`, dark ink on transparent) for packages with `signature`, when they chose to include them: **one, or two** side by side (the customer chooses, e.g. both of the couple). Empty otherwise. Place them where your design has its signature spot with `<Signature signatures={props.signatures} className={…} />` (renders nothing when empty; one or two images side by side; on a dark design invert them with CSS). Leave room for two. Samples show one example signature. On the online invitation `<Signature>` draws each signature again as the customer drew it (stroke by stroke, 1–3 s) when it comes into view, then shows the picture; reduced motion and print show it finished. Always use `<Signature>` (never an `<img>` of `src`) so this works, and keep `className` to size/colour (it styles the drawing too). Only list `signature` in the manifest when the design has that spot. |
| `colors` | The theme's colour slots (manifest `colors.slots`) with the customer's chosen colour set or the defaults. The platform also sets them as CSS variables `--bahja-color-<key>` around the theme (and around print companions), so CSS writes `var(--bahja-color-accent, #c9a45c)`. Required for `color_choice`; the owner makes the colour sets in Admin. |
| `occasion` | Which occasion this invitation is for, as a section key (`wedding`, `engagement`, …). The owner can sell one design in several occasions (Admin → Themes → "Also sold in"); list every occasion your wording supports in the manifest `sections` and pick the wording from `occasion` (e.g. "حفل الخطوبة" / "حفل الزفاف"), falling back to your main occasion's wording for anything else. A design for one occasion can ignore it. Print companions get it too (`occasion` in their props). |
| `wording` | The design's changeable lines (manifest `wording`) by key: the customer's choice, or the Arabic default. Every declared key is present. Also given to print companions and newborn extras. A line in another script than the invitation (Arabic on an English order) should get its own `lang`/`dir`. |
| `switches` | The design's yes/no choices (manifest `switches`) by key: the customer's answer, or the default. Every declared key is present. Also given to print companions and newborn extras. |
| `birthDate` | Newborn designs: the date of birth (`fields.birth_date`) in the invitation's language (`full`, parts) plus `lines`: the date written in the style the customer chose on the order form (Gregorian, numeric, Hijri, or Gregorian + Hijri; Arabic-Indic or Western digits), one or two lines; null when absent. Print the `lines`. With it come `fields.baby_name`, `fields.baby_gender` (`boy` / `girl`; show `labels.itsABoy` / `labels.itsAGirl`), `fields.mother_name`, `fields.father_name` and `fields.baby_quote`. The story, chocolate stickers and bottle label are platform extras drawn on the owner's artwork (Admin), unless the design draws its own (§6, "Newborn extras drawn by the design"). |

## 4. What the theme may use: `@/theme-sdk`

| API | Use |
|---|---|
| `useMusic()` | `start()` from the "Open invitation" tap (phones block autoplay otherwise). A design whose song should only begin when the opening ends calls `prime()` from the tap (unlocks sound silently) and `start()` later. `start()` fades the song in. `toggle()` for the music button; `playing`, `available`. **Music always loops.** It pauses automatically when the phone locks. |
| `GuestFormSlot` | Headless guest form. The theme designs it; the platform validates, submits and stores. Nothing is saved in sample/preview. Renders nothing when the package lacks `rsvp`. |
| `useCountdown(startsAt)` | Live countdown (shared 1-second clock) |
| `useReducedMotion()` | Must be honored: replace big motion with simple fades or none |
| `formatNumber(n, locale)` | Arabic-Indic digits for Arabic/Kurdish |

## 4A. Opening animation (required for sellable themes)

Every non-internal theme starts on a cover with a button labelled `labels.openInvitation`. Its click handler
calls `useMusic().start()` (or `prime()`, with `start()` when the opening ends) and plays the opening animation (CSS `@keyframes`/transitions on `transform` and
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

The QR code is black on white unless the manifest sets `print.card.qrColors: { dark, light }` (e.g. the design's
deep colour on a transparent `#00000000`, so the paper shows through); keep strong contrast so phones scan it.

`print/Card.tsx` and `print/Keepsake.tsx` default-export **server components** (no hooks, no
animation, no fetching) receiving `PrintCardProps` / `KeepsakeProps` from `@/theme-sdk`:

- `fields`, `event.date` / `event.time` (localized), `locale`, `dir`, `lang`;
- `labels` (`date`, `time`, `venue`, `and`, `scanToOpen`, `keepsakeTitle`, `keepsakeEmpty`); never hard-code text;
- the card gets `qrDataUrl` (null when `print.card.qr` is false or the team hid it) and `extraLine`
  (one line the team added, or null); the keepsake gets the visible
  `messages` in order (from none to several hundred: let them flow and use `break-inside: avoid`). Print each
  message's `guestName` under it: it already says whether the guest is coming ("Sara · Coming"), which the couple
  must see; `name` and `attending` are there for a design that shows them its own way.

The platform sets `@page` from the manifest: the card page is the trim size plus `bleedMm` on every
side (A5 + 3 mm = 154 × 216 mm) so the card's root fills exactly that box; the customer's PDF is exactly
A5 with the bleed cropped evenly (the print-shop version keeps it), so keep text inside the 5 mm safe
area. The keepsake is A4: the first page (the cover) has no margin, so the cover section should fill
210 × 297 mm and end with `break-after: page`. Every keepsake page has **no page margin** (so the border sits
in the same place on every page): give the messages section its own padding (about 20 mm top and bottom,
clear of the border at the sides) with `box-decoration-break: clone` so it repeats on each page. No page
numbers are printed. Use physical units and `print-color-adjust: exact`. Chromium renders
it, so the theme's own fonts and Arabic/Kurdish shaping come out as on screen.

### Shaped cards (leaf, heart, arch)

A design may offer shaped printed cards next to the A5 card. On the order form the customer ticks **one, several or
all** of the cards the package sells (the A5 card and/or its shapes; `invitations.card_choices`, read through
`chosenCards`), and gets each ticked card as its own files (PDF; a shape also as PNGs), asked for with `?card=a5|leaf|heart|arch`.
Each shape is sold by its own feature, so a package can offer any of them or none: `leaf` by `card_leaf`, `heart` by `card_heart`,
`arch` (a tall card with a rounded top, or the design's own framed shape) by `card_arch` (all need `print_card`; `CARD_SHAPE_FEATURES` in `src/catalog/features.ts`).
A design may offer several shapes of one kind as `<kind>-<name>` keys (e.g. `arch-oval`, `arch-corners`: several framed
posters), all sold by that kind's feature (`shapeFeature`); the customer ticks the ones they want. A design lists the feature of every shape it
draws, and draws every shape whose feature it lists. Declare them in the manifest
`print.shapes: [{ key, label: {ar, en, ckb?, bdn?}, widthMm, heightMm, outline }]`: `outline` is the cut line, an SVG path in
millimetres (absolute `M`/`L`/`C`/`Q`/`Z`, origin top-left of the `widthMm` × `heightMm` box), usually traced from the
front artwork. `print/Shape.tsx` (required then) default-exports a server component receiving `PrintShapeProps`: the
card's props plus `shape`, `side` (`front`/`back`), this side's box size and `outline` (the back's is the front's
mirrored: the card turned over; with `backSideways: true` the back is a landscape design read with the card turned a
quarter, so its box is `heightMm` × `widthMm` and its outline the front's with x and y swapped), `qrDataUrl`, `extraLine`, and the back's `title`/`message`. Draw the artwork filling
the box, **transparent outside the shape**, with the text well inside it. The platform puts each side on a page with a
10 mm margin (the customer's PDF), adds a thin magenta cut line on the outline for the print shop
(`?bleed=1` / print-shop download), and makes a transparent 300 dpi PNG of each side. Admin → Themes previews every
shape (with or without the cut line).

### Customer photos (`photos`)

A design can show the customer's own photos: list `photos` in `features` and say how many it holds in the manifest,
`photos: { max, min?, aspect?, labels? }`. `max` is 1–20. `min` is how many must be added before the order can be paid
(default 0). `aspect` is the frame's width ÷ height that you draw them in (default 0.75, 3:4): the customer places
each photo in that frame on the order form (drag and zoom). `labels` names the first places (`{ ar, en, ckb?, bdn? }`,
e.g. "Cover photo", "Engagement"). **A collage** gives each place its own shape with `frames: [{ aspect }, …]` (place i
uses `frames[i]`, the rest `aspect`): draw place i in exactly that shape, so what the customer framed is what shows.

Photos always fill the places **in order, without gaps**: `props.photos[i]` (its `index` is i) belongs in place i. The
customer can reorder them. While they adjust a photo, the order page shows your design live beside the frame: it opens
your design already open (as with reduced motion: skip the entrance when `useReducedMotion()` is true), scrolls to the
`<Photo>` with that index and redraws as the photo moves, so draw photos only through `<Photo>`.

The theme receives `props.photos`: the photos in order, each `{ src, width, height, focus, label }`. Draw each with
`<Photo photo={p} className={…} />` from `@/theme-sdk`. Give the frame its size and shape (aspect-ratio, radius, mask);
the photo covers it the way the customer placed it. It loads lazily: pass `eager` for the photo on the cover.

**There may be fewer photos than `max`, even none** (a package without `photos`, or a customer who added only some).
Show what is there; never leave empty frames. Samples show placeholder pictures for every place. Print companions get
the same list in full size (`props.photos` on the card and keepsake). See `themes/demo-photos/v1` (internal, #16).

### Newborn extras drawn by the design

A newborn design may ship its own `print/Story.tsx`, `print/Sticker.tsx` and/or `print/Bottle.tsx`
(server components, default export, `PrintExtraProps` from `@/theme-sdk`). The registry picks them up
automatically; the package still decides which extras are sold (`story`, `sticker`, `bottle_label`), and
owner artwork uploaded in Admin for an extra takes precedence. Each is drawn inside an exact-size box that is
a CSS size container (story 1080 × 1920 px, sticker 40 mm, bottle label in the customer's bottle size from
`src/catalog/products.ts`), so size everything in `cqw`/`cqh`. They receive `fields`, `birthDate`
(use `lines`), `labels`, `shape` (`round`/`square`; the platform clips the round one) and `size`.
The platform adds the watermark before payment, the cut lines and the A4 sheets.
See `themes/embroidered-garden/v1/`.

### Photo collages

Photo collages are platform features any design can be sold with: `collage_polaroids` (an A3 poster, 3 photos),
`collage_story` (an Instagram story, 4 photos) and `collage_wall` (a photo wall printed 4 × 6, 9 photos);
`src/catalog/collages.ts`. A package chooses which ones it sells, so the cheaper ones can have fewer photos. The
customer's photos fill every collage of their package (the order form asks for as many as the largest collage holds;
the design itself still shows only its own `photos.max`). The SDK's `<Collage>` draws them on the owner's artwork, with
the lettering («Happy Birthday», the name, the message) in the invitation's language. A design that wants its own
typefaces on them ships `print/Collage.tsx` (a server component) that renders `<Collage {...props} fonts={…} />` with a
Latin and an Arabic set (`script`, `display`, `body`) inside its fonts class; the registry picks it up. The platform
adds the watermark before payment and makes the JPG pictures. See `themes/blush-floral/v2/print/Collage.tsx`.

## 7. Preview and review

- Admin → Themes → theme → **Preview**: pick a package or state, language, name length and width.
  It renders in an isolated iframe.
- Direct URL: `/admin/preview/<lang>/theme/<key>?v=<version>&state=<n>&names=short|long`.
- CI uploads every screenshot as the `theme-screenshots` artifact, so the owner can compare them with the design.

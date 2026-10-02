# Theme Brief: Olive Ring Box (`olive-ring-box` v1)

Hand-off following `docs/THEME_GUIDE.md`. The theme is built: code in `themes/olive-ring-box/v1/`,
and everything in this folder is generated from it (see "Regenerating" at the end).

| Hand-off item (guide Step 12) | Where |
|---|---|
| Completed brief | this file |
| Screen designs, package variations, form states | `design/screens/` (PNG, generated from the built theme) |
| Exported layers | `themes/olive-ring-box/v1/assets/` (what ships); sources in `assets-src/` |
| Motion specification + reference recording | §7 below, and `motion/opening-390.webm` |
| Licensed font files + licence | `themes/olive-ring-box/v1/fonts/` (§9) |
| Print designs | `print/card/` (A5) and `print/keepsake/` (A4) |
| Audio | none. The owner hasn't chosen a song yet (§8) |

Figma: none. The design was made directly in code, so the screens above are the reference frames.

## 1. Idea

- **Occasion:** Wedding (Muslim).
- **Mood:** intimate, warm, understated, botanical, precious.
- **Experience story:** A closed olive-green velvet ring box rests on softly lit warm beige, with a
  faint halo behind it and an "افتح الدعوة" button beneath. On tap, the hinged lid lifts. A
  champagne glow rises from inside and shows two gold wedding bands in the cushion. A soft light
  crosses the metal and a few tiny motes drift up. The box holds open for a moment, then its light
  spreads into a beige wash that becomes the invitation. The guest scrolls through the basmala,
  the couple's names, the message, date, time and venue, then the countdown, map and reply
  (depending on the package), and ends on a thank-you framed by one small olive sprig.
- **Palette:** warm beige `#F3EBDD`, olive `#626B45`, deep olive text `#39412D`, champagne-gold
  `#C8AF79` (accents and ornaments only; text never uses it because it is too light to read on
  beige). Error colour `#9A3B2E`, a muted brick with 6.6 : 1 contrast on the card colour.
- **Restraint:** exactly three olive points across the page (top corner, one side branch, the
  closing sprig), no wreaths, no glitter, no looping motion behind text.

## 2. Fields

| Field key | Label (Arabic) | Label (English) | Max length | Notes |
|---|---|---|---|---|
| `person_1_name` | اسم العروس | Bride's name | 40 | Wraps onto more lines; never clipped |
| `person_2_name` | اسم العريس | Groom's name | 40 | |
| `event_date` | تاريخ الزفاف | Wedding date | — | Shown as e.g. "الخميس، ١٧ كانون الأول ٢٠٢٦" |
| `event_time` | وقت الزفاف | Wedding time | — | Shown as "٧:٣٠ م" / "7:30 pm" (Baghdad time) |
| `venue_name` | مكان الحفل | Venue | 80 | |
| `venue_map_url` | رابط الموقع | Location link | — | VIP/VVIP only; allow-listed map URL (platform) |
| `invitation_message` | نص الدعوة | Invitation message | **200** | See the open item below |

**Admin setup needed:**
- Set the per-theme labels above in Admin → Themes → Olive Ring Box → Fields. Labels are data,
  not code.
- The platform's message limit is global (Field Library, currently 300). The layout was tested
  at 200 characters and still reads well at 300. To enforce 200, lower it in Admin → Field
  Library. That applies to every theme; a per-theme limit would need a small platform change.

No new fields are needed.

## 3. Packages

| Part of the theme | VVIP (complete) | VIP | Normal |
|---|---|---|---|
| Ring-box opening | ✅ | ✅ | ✅ |
| Audio toggle (only when a song is configured) | ✅ | ✅ | ✅ |
| Basmala, names, message, date, time, venue | ✅ | ✅ | ✅ |
| Countdown | ✅ | ✅ | — |
| Map button | ✅ | ✅ | — |
| Guest form: name + attending / not attending | ✅ | ✅ | — |
| Guest message to the couple (≤ 500 characters) | ✅ | — | — |
| Keepsake PDF of messages | ✅ | — | — |
| Printable A5 invitation card | ✅ | ✅ | ✅ |

These are the manifest's `validStates`, so Admin cannot configure any other combination.

**How the space closes:** every section is its own block in a single column with a fixed 52 px
rhythm. A missing feature removes its whole block, so the next one moves up and no empty band is
left.
- **Normal:** venue card → side olive branch → closing thank-you (`03-invitation-normal-*.png`).
- **VIP:** the form has name and attendance only; the message field and its counter are gone,
  and the submit button sits directly under the choices (`03-invitation-vip-*.png`).

## 4. Screens

All at 390 × 844 unless named otherwise. Arabic RTL is primary.

| Frame | File |
|---|---|
| 01 Closed box + Open button (AR / EN) | `01-closed-ar.png`, `01-closed-en.png` |
| 02 Opening, mid-sequence | `02-opening-a-lid-lifting.png` (0.6 s), `-b-open-glow.png` (1.5 s), `-c-light-wash.png` (2.35 s) |
| 03 Invitation, per package, short + long content | `03-invitation-{normal,vip,vvip}-{short,long}-ar.png` |
| 03 English (LTR) | `03-invitation-vvip-{short,long}-en.png` |
| 04 Other widths / desktop | `04-width-360-…`, `04-width-430-…`, `04-width-1280-…` |
| 05 Guest form states | `05-form-empty.png`, `05-form-error.png`, `05-form-sending.png`, `05-form-success.png`, `05-form-error-vip-en.png` |
| 06 Audio toggle on / off | `06-audio-on-ar.png`, `06-audio-off-ar.png`, `06-audio-on-en.png` |
| 07 Reduced motion, just after tapping Open | `07-reduced-motion-after-tap.png` |

Sample content: short "نور" & "علي"; long "فاطمة الزهراء" & "عبد الرحمن" with an exactly
200-character message and a 79-character venue. English uses "Noor" / "Ali" and
"Fatima Al-Zahraa" / "Abdulrahman".

**Section order:** basmala → names → message → date/time/venue card → (side branch) →
countdown + map → guest form → closing thank-you with sprig.

**English (LTR):** text alignment, the form, the icons' side and the controls mirror. The audio
toggle moves to the top-right, and the top and side olive branches flip to the opposite corners.
The ring-box artwork does not change. The basmala stays in Arabic, with a small English
translation beneath it.

**Desktop:** the 430 px mobile composition stays centred on an extended warm beige
(`#EFE5D3`) with a hairline edge and a soft shadow. No separate desktop layout.

**Typography:** names in Amiri Bold, 36–46 px (`clamp`, `text-wrap: balance`); the basmala in
Amiri Regular 27 px; reading text in IBM Plex Sans Arabic 400/500 at 15–17 px. Line heights are
generous (1.7–1.95) for Arabic.

**Guest form:** labels "اسمك", "هل ستحضر؟" ("سأحضر بإذن الله" / "أعتذر عن الحضور") and
"رسالتك للعروسين (اختياري)" with a live "N حرفًا متبقيًا" counter. Each error appears directly
under its own field with an icon, and the field border turns `#9A3B2E`. While sending, the
button is disabled and shows a spinner with "جارٍ الإرسال…". Success replaces the form with a
check mark, "شكرًا لك" and "تم إرسال ردك إلى العروسين.". Saving, spam protection and server
validation belong to the platform (`GuestFormSlot`). In sample and preview mode nothing is sent.

## 5. Package states

See §3 and the `03-invitation-*` frames. The automated e2e suite
(`e2e/theme-olive-ring-box.spec.ts`) checks every state at 360, 390, 430 and 1280 px. It checks
that each state includes and omits the right sections, that nothing scrolls horizontally, and
that names never clip.

## 6. Layers (exported)

Raster layers are transparent WebP at 2× display size, quality 80. Ornaments are SVG. Every file
is far under budget: the largest image is 18 KB and the background is 4 KB. The WebP files are
rendered from parametric SVG sources in `assets-src/layers.ts`, so every layer shares one light
direction, shadow logic and palette.

| File | Display size (px) | Export (px) | Role |
|---|---|---|---|
| `background.webp` | 390 × 844 | 780 × 1688 | Opening background: warm beige, a pool of light, paper grain |
| `box-shadow.webp` | 340 × 90 | 680 × 180 | Soft contact shadow under the box |
| `box-base-front.webp` | 200 × 70 | 400 × 140 | Velvet base, front face |
| `box-base-side.webp` | 140 × 70 | 280 × 140 | Base left and right faces |
| `ring-insert.webp` | 200 × 140 | 400 × 280 | Top of the base: velvet rim, two padded cushions, the slit |
| `rings.webp` | 200 × 54 | 400 × 108 | Two gold bands standing in the slit (lower part hidden) |
| `lid-top.webp` | 200 × 140 | 400 × 280 | Lid top, with a domed velvet highlight |
| `lid-front.webp` | 200 × 56 | 400 × 112 | Lid front, with the champagne clasp |
| `lid-side.webp` | 140 × 56 | 280 × 112 | Lid left and right faces |
| `lid-inner-wall.webp` | 200 × 56 | 400 × 112 | Inner walls of the lid (front, back, sides) |
| `lid-lining.webp` | 200 × 140 | 400 × 280 | Champagne satin lining with velvet piping |
| `glow.svg` | 300 × 300 | vector | Champagne light from inside the box |
| `particle.svg` | 7 × 7 | vector | Luminous mote (×9) |
| `shimmer.svg` | 60 × 76 | vector | Light sweep, masked to the rings |
| `olive-branch-top.svg` | 150 × 110 | vector | Olive point 1: top inline-start corner |
| `olive-branch-side.svg` | 80 × 100 | vector | Olive point 2: leans in from the inline-end edge |
| `olive-sprig.svg` | 132 × 39 | vector | Olive point 3: frames the closing thank-you |

No text is baked into any artwork.

**Coordinates and pivots.** The box is assembled in CSS 3D from these flat faces
(`opening.module.css`):
- **Stage:** 320 × 300 px, centred above the button. Camera `perspective: 900px` with its origin
  at 50 % / 18 % of the stage. The whole box is tilted `rotateX(-22°)`, as if seen from slightly
  above.
- **Origin O:** the centre of the box at the lid/base seam, at stage (160, 164). x points right,
  y down, z toward the viewer.
- **Base:** front face centre (0, 35, 70). Side faces (±100, 35, 0) rotated ±90° about Y.
  Ring insert (0, 0, 0) rotated 90° about X. Rings plane (0, −27, 0), facing the viewer, with its
  bottom edge on the slit.
- **Lid:** top (0, −56, 0) rotated 90° about X; lining (0, −55.5, 0) rotated −90° about X; front
  (0, −28, 70); sides (±100, −28, 0); inner walls just inside each wall, facing inward.
- **Lid pivot (hinge):** the line through (0, 0, −70), parallel to x, which is the back-top edge
  of the base. The lid opens `rotateX(0 → 105°)` about it.
- **Glow and particles:** flat layers centred at stage (160, 140–150), just above the cushion.

Faces use `backface-visibility: hidden`, so the outside and inside of the lid swap naturally
during the swing. The interior layers (insert, rings, lining, inner walls) are hidden until the
lid starts to lift, so nothing can glint through the closed seams.

**Realism note.** The velvet, satin and metal are procedural renders: layered noise, gradients
and specular highlights, lit consistently from above. They read as velvet at phone size, but
they are not photographs or a 3D render. If the owner wants a fully photographic box, a 3D
artist can render the same faces at the same 2× sizes, file names and coordinates, and they drop
straight into a `v2` of the theme with no code change.

## 7. Motion sheet

Nothing moves until the guest taps Open. The sequence plays once and never loops.
"Soft" = `cubic-bezier(0.45, 0, 0.2, 1)`; "out" = `cubic-bezier(0.2, 0.7, 0.2, 1)`.

| # | Element (file) | Trigger | What happens | Duration | Delay | Easing | Loops? |
|---|---|---|---|---|---|---|---|
| 1 | Open button + hint | Tap Open | Fade out | 0.3 s | 0 | ease | no |
| 2 | Lid (`lid-*.webp`) | Tap Open | Rotates open on the hinge, 0 → 105° | 1.2 s | 0 | soft | no |
| 3 | `glow.svg` | Tap Open | Builds from inside the box: opacity 0 → 0.9, scale 0.45 → 1.05, `screen` blend | 0.9 s | 0.3 s | out | no |
| 4 | `shimmer.svg` (masked to `rings.webp`) | Tap Open | One diagonal sweep across the rings; the rings stay fully visible | 0.9 s | 0.75 s | soft | no |
| 5 | `particle.svg` ×9 | Tap Open | Rise 86–150 px while fading in and out; they stay above the box, never over text | 1.4 s | 0.55–1.2 s (staggered) | out | no |
| 6 | Hold | — | Open box at rest | 0.7 s | from 1.2 s | — | — |
| 7 | Light wash | After #6 | Warm light expands from the box to fill the screen (circular reveal, opacity 0.4 → 1) | 0.8 s | 1.9 s | soft | no |
| 8 | Box stage (box, halo, shadow) | After #6 | Fade out under the wash | 0.6 s | 2.0 s | soft | no |
| 9 | Opening layer | After #7 | Fades out, revealing the invitation beneath | 0.5 s | 2.7 s | soft | no |
| 10 | Each section | Scrolls into view | Fade in + rise ≤ 12 px. The basmala fades only and never moves | 0.6 s | 0 | out | no |
| 11 | Submit spinner | While sending | Rotates (the only repeating motion, and only while sending) | 0.9 s / turn | 0 | linear | while sending |

Total opening time is about 3.2 s. If an animation event never arrives, a 4.5 s failsafe opens
the invitation anyway. Without JavaScript the box is skipped and the invitation shows directly.
The countdown updates once a minute (days, hours, minutes; no ticking seconds), so nothing moves
continuously behind reading areas.

**Reduced motion:** the Open button stays. Tapping it shows the invitation directly: a 0.2 s fade
of the opening layer, with no lid movement, glow, shimmer, particles or light wash. Sections then
appear without the rise.

Reference recording: `motion/opening-390.webm`.

## 8. Music

- **File:** none. No soundtrack is selected or assumed. The owner uploads an authorised MP3 to the
  Music library and assigns it in Admin.
- **Start:** only after the guest taps Open (the same tap unlocks audio on phones). The song
  loops, as the platform requires.
- **Audio toggle:** a 48 × 48 px circle (touch area ≥ 44 × 44) at the top-left of the Arabic
  layout and the top-right in English. It appears after opening, and only when a song is
  configured. **On:** filled olive with a beige speaker and sound waves. **Off:** translucent beige
  with an olive speaker and a ✕. Its `aria-pressed` and label change with the state ("إيقاف
  الموسيقى" / "تشغيل الموسيقى").

## 9. Fonts

| Family | Use | Weights | Licence |
|---|---|---|---|
| **Amiri** (display, Naskh) | Names, basmala, headings, countdown digits | 400, 700 | SIL OFL 1.1 |
| **IBM Plex Sans Arabic** (reading) | Message, details, form, buttons | 400, 500 | SIL OFL 1.1 |

- Four weights in total. Each weight ships an Arabic subset and a Latin subset (WOFF2, loaded by
  `unicode-range`), so English pages don't download Arabic glyphs and vice versa.
- **Kurdish letters ڕ ۆ ێ ڵ ە ڤ ک گ پ چ ژ:** checked glyph by glyph in both families' font
  files (cmap). All are present, with no fallback.
- **Licence:** the OFL allows web use and embedding in PDFs (the print PDFs embed subsets). The
  licence texts ship next to the fonts: `fonts/OFL-amiri.txt` and
  `fonts/OFL-ibm-plex-sans-arabic.txt`.

## 10. Guest form

See §4 "Guest form" and the `05-form-*` frames: empty, validation error, sending and success.
The message supports up to 500 characters, with a live counter that turns to the error colour
when the message is over the limit.

## 11. Print

**A. Printable invitation card:** `print/card/card-a5-{short,long}-{ar,en}.pdf`
- A5 portrait, 148 × 210 mm, plus 3 mm bleed on every edge (the PDF page is 154 × 216 mm). The
  beige background and the two corner branches run into the bleed.
- All text sits well inside the 5 mm safe area (at least 12 mm from the trim at the sides, and
  more at top and bottom).
- Live text only: basmala, names, message, date, time, venue (label above value, since it can be
  80 characters) and the optional QR code with "امسح الرمز لفتح الدعوة". The QR is on by default
  in the manifest (`qr: true`).
- Vector ornaments and embedded fonts, so it prints sharp at 300 dpi and above. Muted palette,
  nothing neon.

**B. Keepsake PDF (VVIP):** `print/keepsake/keepsake-a4-{3,200}-messages-*.pdf`
- A4 portrait. A full-bleed beige cover with "رسائل المحبة", the names, the date and two olive
  branches.
- Message pages repeat as needed. Each message is the text and then "— guest name", separated by
  champagne hairlines, and a message never splits across pages. A full 500-character message fits
  comfortably. 200 messages take 29 pages. The last page closes with the olive sprig and
  "مع خالص الشكر لكل من شاركنا الفرح". The platform adds page size, margins and page numbers.
- Message pages print on white to save ink; only the cover is beige.

## Notes and open items

1. **Song:** pending the owner's choice (§8).
2. **Kurdish:** the theme's fixed wording (`themes/olive-ring-box/v1/copy.ts`) exists in Arabic
   and English only. Sorani and Badini invitations show the Arabic until the owner approves
   translations (listed in `docs/translations/KURDISH_REVIEW.md`).
3. **Message length:** 200 in this brief versus the platform's global 300 (§2).
4. **Photographic artwork:** optional upgrade path (§6, "Realism note").

## Regenerating

```bash
# Artwork layers (only while v1 is in DEVELOPMENT; an activated version is frozen)
pnpm exec tsx docs/themes/olive-ring-box/assets-src/render-layers.ts

# Screens, motion recording and print proofs
pnpm build && pnpm exec next start -p 3300 &
BASE_URL=http://localhost:3300 pnpm exec tsx docs/themes/olive-ring-box/capture.ts
```

Live preview during development: `/dev/themes/olive-ring-box@1?state=0|1|2&locale=ar|en&sample=short|long&music=1`,
plus `/card` and `/keepsake?count=N` under the same path.

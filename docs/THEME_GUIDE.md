# Bahja — How to Create a Theme (Step by Step)

This guide is for the **designer or owner**. It explains exactly what to prepare so a theme can be built to match your vision on the first attempt, without guessing.

**The golden rule:** anything you don't specify has to be guessed. Guessing is where "that's not what I meant" comes from. Every step below removes a guess.

You deliver **one folder per theme** (see Step 12). A blank brief to fill in is at `docs/themes/THEME_BRIEF_TEMPLATE.md`.

---

## Step 1 — The idea (one paragraph)

Write 3–5 sentences:
- **Occasion:** Wedding, Graduation, Birthday, Engagement…
- **Mood:** e.g. "royal, calm, gold on deep green, slow and elegant", or "playful, bright, bouncy".
- **Story of the experience:** what the guest feels from opening to end. For example: "An envelope with a wax seal. Tapping it breaks the seal, the envelope opens, music starts, the card slides up, then the guest scrolls through the names, date, venue and RSVP."
- **References** (optional): links, videos or screenshots of things you like, and *what exactly* you like about each ("the way the petals fall", not just "this site").

## Step 2 — The content: which fields the theme shows

Choose from the **Field Library** (standard names, so the system handles them automatically):

| Field key | Typical meaning (label can change per theme) |
|---|---|
| `person_1_name` | Bride / Graduate / Birthday person |
| `person_2_name` | Groom (weddings and engagements) |
| `event_date` | Date |
| `event_time` | Time |
| `venue_name` | Hall or place name |
| `venue_map_url` | Google Maps link |
| `invitation_message` | Short invitation text |
| `family_names` *(proposed)* | "Son of…" / "Daughter of…" lines |

For each field you use, state:
1. **The label the customer sees**, e.g. `person_1_name` → "اسم العروس / Bride's name".
2. **Maximum length** that still looks good, e.g. names ≤ 20 characters and message ≤ 200. The system enforces this, so the design never breaks.

If you need a field that doesn't exist, describe it and it will be added **to the library** so every future theme can reuse it.

## Step 3 — The packages: what each one removes

Design the theme **complete first**; that complete design is the highest package. Then list what lower packages lose. Use this table. Package names and prices are up to you and editable later in Admin.

| Part of the theme | VVIP (complete) | VIP | Normal |
|---|---|---|---|
| Opening animation (envelope) | ✅ | ✅ | ✅ |
| Music | ✅ | ✅ | ✅ |
| Names, date, time, venue | ✅ | ✅ | ✅ |
| Countdown | ✅ | ✅ | ❌ |
| Map button | ✅ | ✅ | ❌ |
| Guest form: name + attending/not | ✅ | ✅ | ❌ |
| Guest message to the couple | ✅ | ❌ | ❌ |
| Keepsake PDF of messages | ✅ | ❌ | ❌ |
| Printable invitation card | ✅ | ✅ | ✅ *(your choice)* |

**Important:** for every package, decide **what the design looks like when those parts are gone**. Does the gap close up? Does a decorative element take its place? This is Step 5.

## Step 4 — Design the screens (mobile first)

Tool: Figma is best; Photoshop or Illustrator also work.

1. **Frame size:** design at **390 × 844 px** (a normal iPhone/Android size). Also check that everything still works at **360 px** (small Android) and **430 px** (large phones).
2. **Design every "scene" in order.** One frame per moment:
   - `01-closed`: what the guest sees before tapping (the "Open invitation" button is required; see Step 8)
   - `02-opening`: the middle of the opening animation (optional, helps explain the motion)
   - `03-names`, `04-date-venue`, `05-countdown`, `06-guest-form`, `07-thank-you`, …
   - If the invitation scrolls as one long page, you can design one tall frame instead, but mark where each scene begins.
3. **Use real sample text, twice:**
   - a **short** version (e.g. "علي" & "نور")
   - a **long** version (e.g. "عبد الرحمن" & "فاطمة الزهراء", with a 200-character message)

   This shows how the design behaves when names are long. It is the #1 cause of broken layouts.
4. **Arabic (right-to-left) is the main language.** Design in Arabic. Then show one frame in **English (left-to-right)** and tell me what flips. Does the artwork mirror, or only the text alignment?
5. **Desktop:** say "keep the phone-sized composition centered, with this background around it", or design one 1440 px frame.

## Step 5 — Design each package state

For **each lower package**, make a copy of the affected frames showing the final look with parts removed:
- `VIP-04-date-venue`: countdown removed; how does the space close?
- `Normal-06-end`: no guest form; what is the last scene instead?

A theme cannot be activated until every package state looks intentional. This is checked automatically with screenshots.

## Step 6 — Export the layers (the most important technical step)

A flat image **cannot animate in parts**. Anything that moves on its own must be its **own file**.

**Example:** an envelope that opens, with a flower that sways and a gold shimmer:
```
envelope-back.webp      (static back)
envelope-flap.webp      (rotates open, separate)
card.webp               (slides up, separate)
wax-seal.webp           (breaks apart / fades, separate)
flower-left.webp        (sways, separate)
flower-right.webp       (sways, separate)
shimmer.svg             (moves across, separate)
background.webp         (static)
```

Export rules:

| What | Format | Size |
|---|---|---|
| Photos, painted artwork, textures | **WebP** (quality ~80) | 2× the display size (a 390 px-wide image → export 780 px wide) |
| Artwork that needs transparency | **WebP with transparency** (or PNG and it will be converted) | 2× |
| Simple shapes, lines, ornaments, logos, icons | **SVG** (outlined text, no embedded images) | — |
| Full-screen background | WebP, **≤ 250 KB** | 2× |
| Any single image | Aim **≤ 150 KB**; larger ones will be flagged | — |

- **Text must NOT be baked into images.** Names, dates and so on are live text, so they can change for every customer. Decorative words that never change (e.g. "بسم الله الرحمن الرحيم" as calligraphy art) may be an image; say so.
- **Keep the same canvas/position logic.** Either export every layer with the full-frame canvas (easy to position) or give me x/y positions. Full-frame canvas export from Figma is simplest.
- **Naming:** lowercase, hyphens, no spaces, English letters: `flower-left.webp`, not `Flower Left final (2).png`.

## Step 7 — The motion sheet (how things move)

Fill in one row per animation. This replaces vague descriptions like "make it elegant".

| # | Element (file) | Trigger | What happens | Duration | Delay | Easing / feel | Loops? |
|---|---|---|---|---|---|---|---|
| 1 | `wax-seal.webp` | Tap "Open" | Scales down + fades out | 0.6 s | 0 | quick, soft | no |
| 2 | `envelope-flap.webp` | After #1 | Rotates open upward (3D flip) | 1.2 s | 0.3 s | slow start, slow end | no |
| 3 | `card.webp` | After #2 | Slides up out of envelope | 1.0 s | 0.2 s | smooth | no |
| 4 | `flower-left.webp` | Always | Sways ±3° | 4 s | 0 | gentle, like wind | yes |
| 5 | Names text | Scrolls into view | Fades in + rises 20 px | 0.8 s | 0 | smooth | no |

Triggers you can use:
- **Tap** on something
- **Page loaded**
- **After animation #X**
- **Scrolls into view**
- **While scrolling**, where the movement follows the finger (parallax)
- **Always / looping**

**The best reference is a video.** A screen recording, an After Effects export or a phone video of a motion you like. Attach it and reference it in the table ("like `ref-02.mp4` at 0:04").

**Reduced motion:** some people turn off animations in phone settings. Say what they should see instead, e.g. "skip the envelope, show the card directly, keep everything else still". If you say nothing, big motions become simple fades.

## Step 8 — Music

- Choose **one song**, as an MP3 at 128–192 kbps, trimmed to the part you want (about 1–3 minutes). Bahja only uses music you have the right to use.
- Phones **block sound until the guest taps**, which is why the "Open invitation" tap in Step 4 is required. Music starts on that tap.
- Design the small **music on/off button**: where it sits and how it looks in both states.

## Step 9 — Fonts

- **Every font must support Arabic *and* Kurdish letters: ڕ ۆ ێ ڵ ە ڤ ک گ پ چ ژ.** Type these letters in your design tool with the font. If any show as boxes or fall back to another font, the font is rejected.
- Give the font files (`.woff2`, or `.ttf`/`.otf` for conversion) **and confirm the license allows web use and PDF embedding**. Google Fonts are safe.
- Use at most 2 font families and 3–4 weights per theme; each extra weight slows loading.

## Step 10 — The guest form (states)

If the theme includes the guest form, design these states (a small frame each):
1. **Empty:** name field, "attending / not attending" choice, and message field (message only in packages with messages).
2. **Error:** e.g. the name is missing. Show where the red text appears.
3. **Sending:** the button while waiting.
4. **Success:** "Thank you, your response was sent."

You design the look only. Saving, spam protection and validation are done by the platform.

## Step 11 — Printable card and keepsake PDF

These are **separate print designs**, not screenshots of the animated page.

**A. Printable invitation card** (one per theme)
- **Size:** A5 (148 × 210 mm) unless you choose otherwise (5 × 7 in also works).
- **Bleed:** extend the background **3 mm beyond every edge**. Keep text and important art **5 mm inside** the edge.
- **Resolution:** artwork at **300 dpi** at the printed size (A5 = 1748 × 2480 px, or 1819 × 2551 px with bleed).
- **Colours:** avoid neon or very saturated colours; they print duller.
- Mark where the live text goes (names, date, time, venue, message) and the **QR code** position (links to the online invitation), if used.
- Design it with the **long** sample names too.

**B. Keepsake PDF** (only themes/packages with guest messages)
- **Size:** A4 portrait.
- Design three page types:
  1. **Cover:** couple names, date, artwork.
  2. **Message page:** how each message looks (guest name + message). Show how many fit per page and a **long message** (500 characters).
  3. **Closing page** (optional).
- It must work with 3 messages and with 200 messages.

## Step 12 — Hand-off folder

Deliver exactly this structure (zip or shared drive):

```
theme-royal-garden/
├─ brief.md                   ← the filled template (Steps 1, 2, 3, 7, 8 answers)
├─ design/
│  ├─ figma-link.txt          ← or .psd / .ai / .pdf exports
│  ├─ screens/                ← PNG of every frame from Steps 4–5 and 10 (for comparison)
├─ assets/                    ← Step 6 layers, correctly named
├─ motion/                    ← reference videos (ref-01.mp4 …)
├─ fonts/                     ← font files + license note
├─ music/                     ← the MP3
└─ print/
   ├─ card/                   ← card design + 300 dpi layers
   └─ keepsake/               ← keepsake page designs + layers
```

## Step 13 — What happens after you deliver

1. **Build.** The theme is implemented as a new folder (`themes/royal-garden/v1`). **No other theme or platform code is touched.**
2. **Automatic checks.**
   - Every package state is rendered at 360 / 390 / 430 / 1280 px, in Arabic and English, with short and long names.
   - Screenshots are produced for you to compare side by side with your frames.
   - Speed and size budgets, the print card, and the keepsake PDF are checked.
3. **Your review.** You compare the screenshots and a live preview link against your design and send corrections. This round is quick when the steps above were followed.
4. **Deploy.** The theme is deployed; in Admin it appears as **Development**. It is invisible to customers.
5. **Admin setup.** You set the section, package names, prices, features, song and labels, and test every package using the preview. Then set it to **Ready for review**.
6. **Activate.** After the final checklist (every package, mobile and desktop, music, guest form, print card, PDF), set it to **Active**. It now appears in the store.

## Quick checklist before sending

- [ ] Idea paragraph + references with notes on *what* you like
- [ ] Fields chosen, with labels and max lengths
- [ ] Package table filled in
- [ ] Every scene designed at 390 px, with short and long names, Arabic + one English
- [ ] Every lower-package state designed
- [ ] Every moving part exported as its own file, named correctly, no text baked in
- [ ] Motion sheet filled in, with reference videos
- [ ] Reduced-motion behaviour stated
- [ ] Song (MP3) + music button design
- [ ] Fonts tested with ڕ ۆ ێ ڵ ە ڤ + license confirmed
- [ ] Guest form states (if included)
- [ ] Printable card at A5, 3 mm bleed, 300 dpi, QR position
- [ ] Keepsake PDF pages (if included)

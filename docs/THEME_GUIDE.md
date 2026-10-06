# Bahja — How to Create a Theme (Step by Step)

This guide is for the **designer or owner**. It explains exactly what to prepare so a theme can be built to match your vision on the first attempt, without guessing.

Working with a partner or another AI? Start with **`docs/themes/PARTNER_THEME_PACK.md`** (all conditions, the opening animation, and instructions for a person or an AI).

**The golden rule:** anything you don't specify has to be guessed. Guessing is where "that's not what I meant" comes from. Every step below removes a guess.

## The conditions at a glance (must-haves)

A theme is accepted when **all** of these hold. The automatic checks test most of them.

**Screens and languages**
1. Designed **mobile-first at 390 × 844 px**; must also work at 360 px, 430 px and on desktop (1280 px), with no sideways scrolling.
2. **Arabic (right-to-left) is the main design**; English (left-to-right) must work too. Kurdish uses the Arabic layout.
3. Every screen works with **short and long names**, using the field limits: names ≤ 40 characters, venue ≤ 80, family names ≤ 150, invitation message ≤ 300.
4. **Every invitation opens with an animation.** It starts on a closed cover with an **"Open invitation" button**; tapping it plays the **opening animation** (the envelope opens, the box lifts, the curtain parts… about **1.5–3.5 s**, finished within 4 s) and starts the music. A subtle looping "breathing" before the tap is welcome. With reduced motion turned on, the cover simply fades to the invitation. See **Step 7A**. The automatic check fails a theme without it.

**Content**
5. Only fields from the **Field Library**: `person_1_name`, `person_2_name`, `family_names`, `event_date`, `event_time`, `venue_name`, `venue_map_url`, `invitation_message`. New fields are added to the library first.
6. **No customer text baked into images.** Names, dates, venue and message are live text. Fixed decorative words (e.g. calligraphy basmala) may be images.
7. Buttons and form labels use the site's wording (translated automatically); the designer doesn't write them. Extra decorative lines are allowed and are listed for translation.

**Packages**
8. **Any feature can be switched off.** The owner builds each package by ticking features one by one (music, countdown, map, guest form, messages, keepsake, card), so the design must look intentional **with any of them removed**: gaps close up or a decorative element takes the place. Design the complete version plus the main lower packages (e.g. Normal / VIP) as examples; the automatic check also renders the theme with each feature switched off.
9. **Every Wedding package includes the printable card.**
10. Guest form (if included): name + "attending / not attending", plus a **required** message in packages with messages. Design the empty, error, sending and thank-you states.
11. **Public guest messages** (packages with messages): the customer can choose to show all messages **under the invitation** for everyone with the link. Design that list (title, each message with the guest's name, long messages, "be the first" empty state, 1 and 50 messages). When the customer keeps them private, the list is simply absent.

**Motion and media**
12. Everything that moves is **its own layer**: WebP for pictures (2× size, about ≤ 150 KB each, background ≤ 250 KB), SVG for simple shapes.
13. A **motion sheet** (what moves, when, how long) with reference videos.
14. A **reduced-motion version**: what people see if their phone asks for less animation.
15. One **MP3 song** (128–192 kbps, 1–3 min). It loops, so trim it so the end flows into the start.

**Readability and speed**
16. Text must be readable: contrast at least **4.5 : 1** for normal text (3 : 1 for big headings). Tap targets at least **44 × 44 px**.
17. Keep it light: the whole invitation (images + fonts) **about 1.5 MB at most**, with the first screen under ~500 KB. It must open quickly on slow 4G.
18. Fonts must show **Kurdish letters ڕ ۆ ێ ڵ ە ڤ ک گ پ چ ژ**, be licensed for **web and PDF**, and use at most **2 families and 3–4 weights**. Google Fonts are safe.

**Print**
19. **Printable card:** A5 portrait. Design it at **154 × 216 mm** (A5 + 3 mm bleed on every side); the customer's PDF is cut to exactly **148 × 210 mm**. Keep all text and important art **at least 5 mm inside** the A5 edge. 300 dpi artwork. Leave space for the **QR code** (about 25 mm) and **one extra line** of text the team may add, and make sure it still looks right **without the message** and **without the QR**.
20. **Keepsake PDF** (packages with messages): A4, **the same look as the invitation**. Every page is printed **edge to edge with no page margin**: design the cover as the full 210 × 297 mm, and give message pages their own space inside the page (about 20 mm top and bottom, and clear of the border at the sides). Each message shows the guest's name + text (up to 500 characters) and is never split across pages. It must look good with **0, 3 and 200 messages**.
21. **One border for the whole set.** Each theme has **one border** (strips down both edges, or corner ornaments) that appears **identically on the invitation, the printable card and every keepsake page**, so the three look like one set. Deliver it as its own transparent layer: a strip that can repeat downwards, or a top-right corner ornament (it is also turned for the bottom-left). The owner can replace it in Admin with other artwork at any time, so nothing else in the design may depend on its exact shape.

**Delivery**
22. One folder in the structure of Step 12, with the filled-in brief (`docs/themes/THEME_BRIEF_TEMPLATE.md`).


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
| `family_names` | "Son of…" / "Daughter of…" lines |

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
| Printable invitation card | ✅ | ✅ | ✅ *(all Wedding packages; other sections decided later)* |

**Important:** for every package, decide **what the design looks like when those parts are gone**. Does the gap close up? Does a decorative element take its place? This is Step 5.

## Step 4 — Design the screens (mobile first)

Tool: Figma is best; Photoshop or Illustrator also work.

1. **Frame size:** design at **390 × 844 px** (a normal iPhone/Android size). Also check that everything still works at **360 px** (small Android) and **430 px** (large phones).
2. **Design every "scene" in order.** One frame per moment:
   - `01-closed`: the cover the guest sees before tapping, with the "Open invitation" button (required; see Steps 7A and 8)
   - `02-opening-a`, `02-opening-b`, …: key moments of the opening animation (required: at least the start, middle and end)
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

## Step 7A — The opening animation (required for every theme)

Every Bahja invitation begins with an animated opening. It is the "wow" moment, so plan it first.

**What it must be**
- **Cover → tap → opening → invitation.** The cover shows the names (live text) and the "Open invitation" button.
  The opening plays **only after the tap** (phones only allow sound after a tap, and the tap starts the music).
- **Length:** about **1.5–3.5 seconds**; everything must be finished within **4 seconds**, then the guest can read and scroll.
- **Optional idle loop before the tap:** a small, slow movement (a glow, a shimmer, a breathing seal) so the cover feels alive.
- **Reduced motion:** when the phone asks for less animation, the cover just fades (≤ 0.3 s) to the invitation.
- **Light and smooth:** only moving, scaling, rotating and fading layers (no heavy video unless it is short and small).
  The cover and its layers together about **≤ 500 KB**, so it appears fast on 4G.
- Works in **Arabic (RTL) and English (LTR)**. Say whether anything mirrors; artwork usually does not.

**Ideas** (pick one per theme, or invent your own): envelope with a wax seal that breaks and the flap opens; a ring box
whose lid lifts (our Olive Ring Box); curtains or doors that part; a scroll that unrolls; a gate with ornaments that
swing open; petals or confetti falling as the card rises; a painted cover that dissolves into the scene (our Zaxo Watercolor).

**What to deliver for it**
1. **Storyboard frames** `02-opening-a`, `-b`, `-c` (start, middle, end) at 390 × 844.
2. **Each moving piece as its own layer** (Step 6): e.g. `seal.webp`, `flap.webp`, `card.webp`, `glow.svg`.
3. **Motion sheet rows** (Step 7) for every piece: trigger, what happens, duration, delay, feel.
4. **A reference video** of the opening (screen recording, After Effects/Figma prototype export, or even a phone video of a paper mock-up).
5. **The reduced-motion version** (usually "fade straight to the invitation").

**How we build it** (for the developer or the AI)
- **CSS animations** (`@keyframes` in the theme's CSS Module) on the separate layers: `transform` (move, scale, rotate, 3D flip)
  and `opacity` only, so it stays smooth on cheap phones. This is how Olive Ring Box (3D lid, 3.2 s) and Zaxo Watercolor (cover fade + content rise) are built.
- The tap handler calls `useMusic().start()` and switches the theme to its "opening" state, which starts the keyframes.
- `useReducedMotion()` from the theme SDK: when true, skip the sequence and fade.
- Optional for complex motion: a **Lottie** animation (JSON exported from After Effects) or a short **MP4/WebM** (≤ 300 KB, muted, plays inline) as one layer. Only npm UI libraries are allowed, and they count toward the size budget.
- The automatic theme check taps "Open", confirms that an animation plays, that it ends within 4 s, and that with reduced motion the invitation shows within 1 s.

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
- **The song loops automatically** when it ends, for as long as the guest stays on the invitation. Trim it so the end flows back into the start without a jarring jump.
- The same song can be used by several themes; you upload it once to the Music library and assign it wherever you want.
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
- **Size:** A5 portrait (148 × 210 mm). (5 × 7 in is possible if you decide so for a theme.)
- **Bleed:** design the background **3 mm beyond every edge** (154 × 216 mm). The customer's PDF is cut to exactly A5; a print-shop version keeps the bleed.
- **Safe area:** keep text and important art **5 mm inside** the A5 edge.
- **Resolution:** artwork at **300 dpi** at the printed size (with bleed: 1819 × 2551 px).
- **Colours:** avoid neon or very saturated colours; they print duller.
- Mark where the live text goes (names, date, time, venue, message), the **QR code** (about 25 mm, links to the online invitation) and **one optional extra line** (the team can add e.g. "Family invitation").
- It must still look balanced **without the message** and **without the QR code**; the team can turn both off per customer.
- Design it with the **long** sample names too.
- The team can always upload a fully custom A5 PDF for one customer instead; your design is the automatic default.

**B. Keepsake PDF** (packages with guest messages)
- **Size:** A4 portrait, **in the same visual identity as the invitation** (colours, fonts, ornaments).
- Page types:
  1. **Cover:** full page with **no margin** (design the whole 210 × 297 mm): names, date, artwork.
  2. **Message pages:** no page margin (the border runs along the paper edges): keep about 20 mm free at the top and bottom and stay clear of the border at the sides. Show how each message looks (guest name + message), how many fit per page, and a **long message** (500 characters). A message is never split across two pages.
  3. **Closing** (optional): a short thank-you after the last message.
- It must work with **0**, **3** and **200** messages (with 0, a short "no messages yet" line is shown).

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

1. **Build.** The theme becomes one new folder in GitHub (`themes/royal-garden/v1`), written from your design by the developer (or by you, if you code it yourself). **No other theme or platform code is touched.**
2. **Automatic checks** run every time that folder is pushed to GitHub, before anything can go live:
   - Every package state is rendered at 360 / 390 / 430 / 1280 px, in Arabic and English, with short and long names.
   - The opening animation is tapped and checked (it plays, ends within 4 s, and is skipped with reduced motion).
   - Screenshots are produced for you to compare side by side with your frames.
   - Speed and size budgets, the print card, and the keepsake PDF are checked.
   - The theme is checked for breaking the rules (touching payments, the database, other themes or site-wide styles). If anything fails, it can't be merged.
3. **Your review.** You compare the screenshots and a live preview link against your design and send corrections. This round is quick when the steps above were followed.
4. **Deploy.** The theme is deployed; in Admin it appears as **Development**. It is invisible to customers.
5. **Admin setup.** You set the section, package names, **prices (IQD, and USD when card payments are enabled)**, song and labels, and test every package using the preview. Then set it to **Ready for review**.
6. **Activate.** After the final checklist (every package, mobile and desktop, music, guest form, print card, PDF), set it to **Active**. It now appears in the store.

## Quick checklist before sending

- [ ] Idea paragraph + references with notes on *what* you like
- [ ] Fields chosen, with labels and max lengths
- [ ] Package table filled in
- [ ] Every scene designed at 390 px, with short and long names, Arabic + one English
- [ ] Every lower-package state designed
- [ ] Every moving part exported as its own file, named correctly, no text baked in
- [ ] **Opening animation:** cover frame, storyboard (start / middle / end), layers, reference video, 1.5–3.5 s
- [ ] Motion sheet filled in, with reference videos
- [ ] Reduced-motion behaviour stated
- [ ] Song (MP3) + music button design
- [ ] Fonts tested with ڕ ۆ ێ ڵ ە ڤ + license confirmed
- [ ] Guest form states (if included)
- [ ] Public guest messages list: title, long message, empty state, 1 and 50 messages (if messages included)
- [ ] Printable card: A5 + 3 mm bleed, 5 mm safe area, 300 dpi, QR + extra-line positions, works without message/QR
- [ ] Keepsake PDF: full-bleed cover, message pages (margins, page number clear), 0 / 3 / 200 messages
- [ ] Text contrast and tap sizes checked; total size about ≤ 1.5 MB

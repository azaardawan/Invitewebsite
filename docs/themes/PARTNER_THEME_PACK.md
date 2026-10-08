# Bahja Theme Partner Pack (start here)

Everything a partner needs to make a Bahja invitation theme: the conditions, the required opening
animation and how to build it, and step-by-step instructions whether the theme is made by **a person**
(designer and/or developer) or by **an AI**. The detailed design steps are in `docs/THEME_GUIDE.md`;
the code rules are in `docs/THEME_CONTRACT.md`. This page is the summary and the rules of the road.

---

## 1. What a theme is

A theme is one animated, mobile-first digital invitation design (for example "Olive Ring Box" or
"Zaxo Watercolor"). Customers pick a theme and a package (Normal / VIP / VVIP), type their names, date
and venue, and send the link to their guests. The **platform** does everything else: ordering, payment,
saving guest replies, translations, the printable card and keepsake PDFs. **A theme only draws.** It
receives the customer's data and shows it beautifully.

Each theme is **one folder**: `themes/<key>/v1/`. Nothing outside that folder is ever changed for a theme.

## 2. The conditions (all must hold)

A theme is accepted when **all** of these hold. The automatic checks test most of them.

**Screens and languages**
1. Designed **mobile-first at 390 × 844 px**; must also work at 360 px, 430 px and on desktop (1280 px), with no sideways scrolling.
2. **Arabic (right-to-left) is the main design**; English (left-to-right) must work too. Kurdish uses the Arabic layout.
3. Every screen works with **short and long names**, using the field limits: names ≤ 40 characters, venue ≤ 80, family names ≤ 150, invitation message ≤ 300.
4. **Every invitation opens with an animation.** It starts on a closed cover with an **"Open invitation" button**; tapping it plays the **opening animation** (the envelope opens, the box lifts, the curtain parts… about **1.5–3.5 s**, finished within 4 s) and starts the music. A subtle looping "breathing" before the tap is welcome. With reduced motion turned on, the cover simply fades to the invitation. See **section 3** below. The automatic check fails a theme without it.

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

22. **Back of the printable card.** Every printed card has two sides. Design the **back** too: it is **horizontal (landscape)** while the front is vertical, so design it at **216 × 154 mm** (A5 sideways + 3 mm bleed): the same theme but its own layout, with a **big title** and a **smaller message** written by the customer, then their names or their signature at the bottom (like a thank-you card). Make it work with a short title only, a long message (300 characters), and with or without a signature. The border appears on both sides.

**Optional features (only if the owner asks for them in this theme)**
23. **Signature spot.** Mark where the customer's own signature goes on the invitation (and, if wanted, the card back). The customer chooses **one or two signatures** (e.g. both of the couple), so leave room for two side by side. It arrives as dark ink on a transparent background; say if it should be shown light on a dark design.
24. **Colour sets.** If customers may choose the colours, list the colours that can change (e.g. background, accent, text) with the default for each, and make sure the design stays readable with the owner's sets. The owner makes the sets in Admin.

**Delivery**
25. One folder in the structure of `docs/THEME_GUIDE.md` Step 12, with the filled-in brief (`docs/themes/THEME_BRIEF_TEMPLATE.md`).


## 3. The opening animation (required for every theme)

Every Bahja invitation begins with an animated opening: it is the "wow" moment guests remember.

**The rules**
- **Cover → tap "Open invitation" → opening animation → invitation.** The cover shows the couple's names
  (live text) and the button. The opening plays only after the tap, and the same tap starts the music.
- **Length about 1.5–3.5 s, finished within 4 s.** Then the guest reads and scrolls.
- **Optional idle loop before the tap:** something small and slow (a glow, a shimmer, a breathing seal).
- **Reduced motion:** if the phone asks for less animation, the cover simply fades and the invitation is
  visible within 1 s.
- **Smooth on cheap phones:** animate only position, scale, rotation (including 3D flips) and opacity of
  separate layers. Cover and its layers together about **≤ 500 KB**.
- **Both directions:** works in Arabic (right-to-left) and English (left-to-right).

**Ideas:** an envelope whose wax seal breaks and flap opens; a ring box whose lid lifts (our Olive Ring Box);
curtains or wooden doors that part; a scroll that unrolls; a gate whose ornaments swing open; petals or
confetti falling as the card rises; a painted cover that dissolves into the scene (our Zaxo Watercolor).

**What the designer delivers for it**
1. The cover frame (`01-closed`) and storyboard frames `02-opening-a/-b/-c` (start, middle, end) at 390 × 844 px.
2. Every moving piece as its own transparent layer (WebP, or SVG for simple shapes), named in English, e.g. `seal.webp`.
3. Motion-sheet rows for each piece: trigger, what happens, duration, delay, feel (`THEME_GUIDE.md` Step 7).
4. A reference video of the opening (After Effects/Figma prototype export, screen recording, or a phone video of a paper mock-up).
5. The reduced-motion version (usually "fade straight to the invitation").

**How it is built**
- CSS `@keyframes` in the theme's CSS Module, on the separate layers, using `transform` and `opacity`.
  Olive Ring Box (`themes/olive-ring-box/v1/RingBox.tsx` + `opening.module.css`, a 3.2 s 3D lid) and
  Zaxo Watercolor (`themes/zaxo-watercolor/v1/Theme.tsx`, cover fade and content rise) are working examples.
- The "Open" button's click handler calls `useMusic().start()` and switches the theme into its opening state.
- `useReducedMotion()` from `@/theme-sdk`: when true, skip the sequence and fade.
- For very complex motion: one Lottie animation (After Effects → JSON) or one short muted inline MP4/WebM
  (≤ 300 KB) as a layer. It counts toward the size budget.
- **Checked automatically:** the theme test taps "Open", confirms an animation plays, that it ends within
  4 s, and that with reduced motion the invitation shows within 1 s. A theme that fails can't be merged.

## 4. Who does what

| Role | Does |
|---|---|
| **Owner** | Approves the idea, gives GitHub access, reviews screenshots, approves Kurdish wording, merges, sets prices and packages in Admin, activates. |
| **Designer** (person) | Makes the design and the hand-off folder (`THEME_GUIDE.md` Steps 1–12, brief template). |
| **Builder** (a developer or an AI) | Turns the hand-off folder into `themes/<key>/v1/` and makes every automatic check pass. |

The designer and the builder can be the same person, and the builder can be an AI.

**Access and branches (same for a person or an AI)**
1. The owner invites the partner on GitHub: repository `azaardawan/Invitewebsite` → Settings → Collaborators.
2. The partner works only on a new branch named `theme/<key>` (for example `theme/royal-garden`). **Never on `main`.**
3. The hand-off folder goes in `docs/themes/<key>/` on that branch; the code goes in `themes/<key>/v1/`.
4. When the checks pass, the partner opens a pull request into `main` with the screenshots and notes.
5. The owner reviews and merges. The site then rebuilds and the theme appears in Admin → Themes as
   **Development**, invisible to customers, until the owner sets packages and prices and activates it.

## 5. Instructions for a person

**If you design only:** follow `docs/THEME_GUIDE.md` Steps 1–12, fill in `docs/themes/THEME_BRIEF_TEMPLATE.md`,
and deliver the folder (Step 12). Use the quick checklist at the end of the guide before sending.

**If you also build it by hand (developer):**
1. Requirements: Node 22+, pnpm 10, PostgreSQL 16. Set up with the commands in `README.md` → "Local development".
2. Read `CLAUDE.md`, `docs/THEME_CONTRACT.md`, `src/theme-sdk/types.ts`, `src/theme-sdk/print.ts`, and the two example themes.
3. Copy `themes/olive-ring-box/v1/` to `themes/<key>/v1/` as a starting point and replace the design.
   Set `key`, `version: 1`, `title`, `sections`, `fields`, `features`, `validStates` and `print` in `manifest.ts`.
4. Preview while working: `pnpm dev`, then Admin → Themes → your theme → Preview (all packages, 4 languages, short/long names, widths).
5. Before every push run:
   ```bash
   pnpm lint && pnpm typecheck && pnpm build
   pnpm exec playwright test e2e/themes.spec.ts
   ```
   and look at the screenshots in `test-results/` (every state, every width, every language).

## 6. Instructions for an AI

**Use a coding AI that works inside the repository** (for example Claude Code opened on the branch
`theme/<key>`). It must be able to read the code and run the checks. A chat-only AI can only produce a
draft that a person must then fix; if you use one, give it every file listed in `docs/THEME_AI_HANDOFF.md`.

**Prompt to paste** (replace `<key>`):

> You are adding a new invitation theme to the Bahja repository, on the branch `theme/<key>`.
>
> 1. Read `CLAUDE.md`, `docs/themes/PARTNER_THEME_PACK.md`, `docs/THEME_CONTRACT.md`, `docs/THEME_GUIDE.md`,
>    `src/theme-sdk/types.ts`, `src/theme-sdk/print.ts`, and every file in `themes/olive-ring-box/v1/` and
>    `themes/zaxo-watercolor/v1/`.
> 2. The design hand-off is in `docs/themes/<key>/` (brief, frames, layers, fonts, music, motion sheet, opening-animation video).
> 3. Create only `themes/<key>/v1/` (with its `assets/`). Do not change any other file: no platform code, no other
>    theme, no hand edits to `src/theme-registry/`, no translation files.
> 4. Follow the contract exactly:
>    - `manifest.ts` with `defineTheme` and the `validStates` from the brief;
>    - `Theme.tsx` as a `'use client'` default export taking `ThemeProps`, styled with CSS Modules only,
>      importing only `@/theme-sdk` and `@/catalog`;
>    - **an opening animation**: a cover with the `labels.openInvitation` button; its tap calls
>      `useMusic().start()` and plays the opening from the brief (transform/opacity keyframes, 1.5–3.5 s, done
>      within 4 s); with `useReducedMotion()` the cover just fades;
>    - every visible text comes from `labels` or the invitation `fields`, never hard-coded, not even "&"
>      (use `labels.and`); any fixed decorative lines go in a `copy.ts` with Arabic and English, and the Kurdish
>      lines are listed in `docs/themes/<key>/KURDISH.md` for the owner to approve (never invent Kurdish);
>    - **one border** in `border.ts` (strips or corners, artwork from the hand-off), rendered with `<ThemeBorder>` on the
>      invitation (`medium="screen"`), the card and the keepsake (`medium="print"`), always passing `props.border`;
>    - `GuestFormSlot` for the guest form (all states), and the `guestbook` list under the invitation when it is not null;
>    - `print/Card.tsx` (A5 + 3 mm bleed, 5 mm safe area, QR and extra line), `print/CardBack.tsx` (the back,
>      landscape 216 × 154 mm: big `title`, smaller `message`, then the signatures or the names) and `print/Keepsake.tsx` (A4,
>      full-page cover, messages that never split) when the manifest lists `print_card` / `keepsake_pdf`;
>    - size budget: about 1.5 MB total, first screen under 500 KB; fonts that show Kurdish letters.
> 5. Run `pnpm lint && pnpm typecheck && pnpm build && pnpm exec playwright test e2e/themes.spec.ts` and fix
>    everything until all pass. Compare the screenshots of every state with the design frames.
> 6. Commit on `theme/<key>`, push, and open a pull request into `main` listing: the checks that passed, the
>    screenshots to review, the Kurdish lines to approve, and anything in the design you could not match.

## 7. Things that are never allowed

- Changing anything outside `themes/<key>/` and `docs/themes/<key>/` (payments, database, other themes, site styles).
- Editing a theme version that has already been activated: copy it to `v2` instead.
- Text baked into images, or hard-coded words in code (all text must translate).
- Writing Kurdish without the owner's approval.
- Music, fonts or images without the right to use them commercially (web **and** PDF for fonts).
- Secrets, passwords or keys anywhere in the theme.

## 8. Acceptance checklist (the owner checks before activating)

- [ ] Pull request: all automatic checks green (lint, typecheck, build, `e2e/themes.spec.ts`).
- [ ] Opening animation plays on "Open", matches the reference video, music starts, ends within 4 s.
- [ ] Screenshots of every package state at 360 / 390 / 430 / 1280 px look like the design, in Arabic and English, short and long names.
- [ ] Kurdish preview (Sorani and Badini) has no Arabic or English left over; Kurdish lines approved.
- [ ] Guest form states, public guest messages (0, 1, 50), countdown and map behave.
- [ ] Printable card and keepsake PDF downloaded from a test order and checked on paper size; the same border on the invitation, the card and every keepsake page.
- [ ] Opened on a real phone on mobile data: fast, smooth, readable.
- [ ] Admin: theme name and packages in all four languages, prices set, song assigned, then **Active**.

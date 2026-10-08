# Handing a Theme to Another AI

> The complete partner instructions (conditions, opening animation, person and AI workflows, and the
> up-to-date prompt) are in **`docs/themes/PARTNER_THEME_PACK.md`**. Use the prompt there; this page
> explains why an AI needs repository access.

`docs/THEME_GUIDE.md` is a **design brief**: it tells a designer (or an AI) what to make. On its own it
is not enough for an AI to produce a theme that plugs into Bahja, because the theme must also follow
the code contract and pass the automatic checks. This page lists what the other AI needs and gives a
prompt you can paste.

## What the other AI must have

| Needs | Why |
|---|---|
| **Access to this repository** (a coding AI such as Claude Code, opened on a branch of this repo) | It must read the SDK types and an example theme, and run the checks. A chat-only AI can't run them, so its code is a draft that someone still has to fix. |
| `CLAUDE.md` | Project rules (it is read automatically by Claude Code). |
| `docs/THEME_GUIDE.md` | Your conditions and the design steps. |
| `docs/THEME_CONTRACT.md` | The code contract: folder, manifest, props, allowed imports, print companions. |
| `src/theme-sdk/types.ts`, `src/theme-sdk/print.ts` | The exact props and labels the theme receives. |
| `themes/olive-ring-box/v1/`, `themes/zaxo-watercolor/v1/` | Complete working examples (opening animation, music, countdown, map, guest form, guest messages, card, keepsake). |
| Your design files | Layers, fonts, music, motion notes, in a folder inside the repo (for example `docs/themes/<key>/`). |

If you can only give it the files (no repository access), give it **all** of the files above and
expect to have the result checked and fixed here before it can be activated.

## What "done" means

The theme is finished only when, on its branch:

```bash
pnpm lint && pnpm typecheck && pnpm build
pnpm exec playwright test e2e/themes.spec.ts
```

all pass. `e2e/themes.spec.ts` renders every designed package state at 360/390/430/1280 px in all four
languages with short and long names, and fails on errors, sideways scrolling, missing features that
should be there, or features that should not be.

## Prompt to paste

> You are adding a new invitation theme to the Bahja repository.
>
> 1. Read `CLAUDE.md`, `docs/THEME_CONTRACT.md`, `docs/THEME_GUIDE.md`, `src/theme-sdk/types.ts`,
>    `src/theme-sdk/print.ts`, and every file in `themes/olive-ring-box/v1/`.
> 2. My design hand-off is in `docs/themes/<key>/` (brief, layers, fonts, music, motion notes).
> 3. Create **only** `themes/<key>/v1/` (and assets under it). Do not change any other file: no
>    platform code, no other theme, no hand-edits to `src/theme-registry/`.
> 4. Follow the contract exactly: `manifest.ts` with `defineTheme` and the `validStates` from my brief;
>    `Theme.tsx` as a `'use client'` default export taking `ThemeProps`; CSS Modules only; import only
>    `@/theme-sdk` and `@/catalog`; all visible text from `labels` or the invitation `fields` (never
>    hard-coded words, in any language); **an opening animation** after the "open" tap (1.5–3.5 s,
>    done within 4 s) that also starts music with `useMusic().start()`; honor `useReducedMotion()`; use `GuestFormSlot` for the guest form; render `guestbook`
>    under the invitation when it is not null (`labels.guestbookTitle`, `labels.guestbookEmpty`);
>    add `print/Card.tsx` (A5 + 3 mm bleed), `print/CardBack.tsx` (the back of the card) and `print/Keepsake.tsx` (A4) when the manifest lists
>    `print_card` / `keepsake_pdf`.
> 5. Run `pnpm lint && pnpm typecheck && pnpm build && pnpm exec playwright test e2e/themes.spec.ts`
>    and fix everything until they pass. Look at the saved screenshots for each state and compare them
>    with my design.
> 6. Commit on a new branch and tell me which checks passed and anything in my design you could not
>    match.

## After it is delivered

Activation is done here, not by the other AI: review the screenshots, preview it in Admin → Themes,
create its packages, then activate. Once activated, that version is frozen; changes go in `v2`.

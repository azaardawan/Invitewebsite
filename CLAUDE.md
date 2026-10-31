# Working on Bahja

Read `docs/ARCHITECTURE_PROPOSAL.md` first; it is the source of truth for decisions. The original
product spec's §74 business rules override assumptions.

- **Next.js 16**: APIs differ from older versions (e.g. `proxy.ts` replaces middleware, request APIs
  are async). Check `node_modules/next/dist/docs/` before using an API you're unsure about.
- The platform owns business logic; themes (later, `themes/`) only render data through the theme SDK.
- `src/server/**` is server-only. Client components (`'use client'`) must not import it
  (an ESLint rule blocks this in `src/components`).
- Every admin page **and** server action calls `requireAdmin({ permission })`. Never rely on hiding UI.
- Important admin actions write to `audit_logs` via `recordAudit`, inside the same transaction as the change.
- Never put secrets (password hashes, TOTP secrets, tokens) in audit `before`/`after` values.
- User-visible text goes in `src/i18n/messages/{ar,en,ckb,bdn}.json`. **Kurdish (ckb/bdn) is approved automatically**
  (owner rule, 2026-10-20): write the Sorani and Badini directly, never wait for the owner, and list every new Kurdish
  text in a `docs/translations/KURDISH_REVIEW.md` batch marked "✅ AUTO-APPROVED"; the owner checks and corrects them
  in Admin → Translations.
- Schema change: edit `src/server/db/schema`, run `pnpm db:generate`, commit the SQL in `drizzle/`.
  Custom SQL (triggers, grants) goes in `pnpm drizzle-kit generate --custom` migrations.
- Before pushing: `pnpm lint && pnpm typecheck && pnpm i18n:check && pnpm test && pnpm build`,
  plus `pnpm exec playwright test` for UI changes.
- The owner works in several chats at once, each on its own branch. **Stay current with `main`:** run
  `git fetch origin main && git merge origin/main` when you start a task, again before every push, and
  before opening a PR (merge, never rebase or force-push a pushed branch). Resolve conflicts keeping both
  sides' work. If `main` added migrations, renumber yours after them: take `main`'s `drizzle/meta`, delete
  your migration SQL, run `pnpm db:generate` again. Kurdish review batch numbers: take the next free number.
  Then rerun the checks above before pushing.
- Themes live in `themes/<key>/v<N>/` with a `manifest.ts` (`defineTheme`). The registry
  (`src/theme-registry/generated.ts`) is generated automatically; never hand-register a theme.
  Theme code may only import `@/theme-sdk` and `@/catalog` (ESLint enforces this).
- Every theme has a permanent number in `themes/numbers.json` (shown as `#N` in Admin). When the owner says
  "theme 7", look the key up there. A new theme folder gets the next number when the registry is generated;
  commit the file. Numbers are never reused.
- The owner can replace either side of a theme's printable card with their own artwork in Admin
  (`themes.card_design`, `src/server/catalog/card-design.ts`); the platform writes the text on it.
- Newborn extras (`story`, `sticker`, `bottle_label`) are platform features drawn by `src/components/print/Products.tsx`
  on the owner's artwork (`src/server/products/*`), or by the design's own `print/Story|Sticker|Bottle.tsx`
  (THEME_CONTRACT §6). Anything shown before payment is watermarked by the server's render (`isPaid`);
  files (PNG/PDF) are only served once paid.
- Customer photos (`photos` feature, manifest `photos: { max ≤ 20, min, aspect, labels }`) are stored per invitation
  (`invitation_photos`, files under `photos/`, `src/server/photos/*`). Themes draw `props.photos` with `<Photo>`, and must
  look right with fewer photos than `max`. They are personal data: housekeeping deletes them with the guest data.
- Customer songs (`custom_music`, a platform feature that needs `music`): the upload (audio or video) is converted by
  ffmpeg to a 2-minute MP3 (`src/server/media/song.ts`, `src/server/music/*`) and plays instead of the design's song.
  The customer must confirm their rights (audited). Personal data: deleted with the photos.
- Photo collages (`collage_polaroids` / `collage_story` / `collage_wall`, platform features, `src/catalog/collages.ts`): the
  customer's photos fill each collage of their package (the order form asks for the largest one's count), drawn by the SDK's
  `<Collage>` (`src/theme-sdk/collage.tsx`), in the design's typefaces when it has `print/Collage.tsx` (THEME_CONTRACT §6).
  Watermarked previews before payment; the JPGs only once paid.
- Couples (owner, 2026-10-31): a section that is not an invitation (no date, venue or replies), mainly photos plus one video.
  Its designs are **template designs** (manifest `editor: 'template'`): the customer fills the design in place
  (`TemplateEditor`, texts saved via `/p|r/[token]/text`, `src/server/template/*`) instead of the order form; the SDK's
  `<EditableText>`, `<PhotoSlot>`, `<VideoSlot>` (THEME_CONTRACT "Template designs"). A package can sell fewer photos
  than the design holds (`packages.photo_limit`). The video (`video`, `src/server/video/*`, ffmpeg in `media/video.ts`):
  one MP4 of at most a minute, personal data deleted with the photos. Posters (`couple_poster`): the design's
  `print/CouplePoster.tsx`, with Bahja's website, WhatsApp/phone and Instagram from Settings at the bottom.
- Every design has an online invitation, newborn included (owner, 2026-10-28). A manifest with `onlineInvitation: false`
  is files only: never link to or serve `/i/` for it.
- A theme version that has been activated is **frozen**. Never edit its folder; copy it to `v<N+1>`.
- `pnpm db:seed` is idempotent and runs on every deploy: permissions/roles, field library, starter
  sections, theme registration. It never overwrites owner edits.
- Catalog changes go through `src/server/catalog/*` services (validation, locking, audit), never direct SQL from pages.
- Theme code follows `docs/THEME_CONTRACT.md`. Themes are rendered only via `InvitationView` +
  the generated `ThemeHost` (per-theme lazy chunks). Never import a theme directly into platform code.
- `e2e/themes.spec.ts` validates every theme state automatically; a new theme must pass it.

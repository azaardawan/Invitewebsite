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
- User-visible text goes in `src/i18n/messages/{ar,en}.json`. **Never write Kurdish (ckb/bdn)
  translations directly.** Add suggestions to `docs/translations/KURDISH_REVIEW.md` for owner approval.
- Schema change: edit `src/server/db/schema`, run `pnpm db:generate`, commit the SQL in `drizzle/`.
  Custom SQL (triggers, grants) goes in `pnpm drizzle-kit generate --custom` migrations.
- Before pushing: `pnpm lint && pnpm typecheck && pnpm i18n:check && pnpm test && pnpm build`,
  plus `pnpm exec playwright test` for UI changes.
- Themes live in `themes/<key>/v<N>/` with a `manifest.ts` (`defineTheme`). The registry
  (`src/theme-registry/generated.ts`) is generated automatically; never hand-register a theme.
  Theme code may only import `@/theme-sdk` and `@/catalog` (ESLint enforces this).
- Every theme has a permanent number in `themes/numbers.json` (shown as `#N` in Admin). When the owner says
  "theme 7", look the key up there. A new theme folder gets the next number when the registry is generated;
  commit the file. Numbers are never reused.
- The owner can replace either side of a theme's printable card with their own artwork in Admin
  (`themes.card_design`, `src/server/catalog/card-design.ts`); the platform writes the text on it.
- Newborn extras (`story`, `sticker`, `bottle_label`) are platform features drawn by `src/components/print/Products.tsx`
  on the owner's artwork (`src/server/products/*`). Anything shown before payment is watermarked by the server's
  render (`isPaid`); files (PNG/PDF) are only served once paid.
- A theme version that has been activated is **frozen**. Never edit its folder; copy it to `v<N+1>`.
- `pnpm db:seed` is idempotent and runs on every deploy: permissions/roles, field library, starter
  sections, theme registration. It never overwrites owner edits.
- Catalog changes go through `src/server/catalog/*` services (validation, locking, audit), never direct SQL from pages.
- Theme code follows `docs/THEME_CONTRACT.md`. Themes are rendered only via `InvitationView` +
  the generated `ThemeHost` (per-theme lazy chunks). Never import a theme directly into platform code.
- `e2e/themes.spec.ts` validates every theme state automatically; a new theme must pass it.

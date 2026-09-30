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

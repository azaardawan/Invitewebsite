# Bahja (بهجه)

Curated digital invitations for the Iraqi market. Arabic first, plus English, Kurdish Sorani and Kurdish Badini.

- Architecture and decisions: [`docs/ARCHITECTURE_PROPOSAL.md`](docs/ARCHITECTURE_PROPOSAL.md)
- How to design a theme: [`docs/THEME_GUIDE.md`](docs/THEME_GUIDE.md)
- Translations and the Kurdish review list: [`docs/translations/`](docs/translations/)

## Status

**Milestone M1 (foundation) is complete:**
- Next.js 16 app with Arabic (default, `/`), English (`/en`), Sorani (`/ckb`) and Badini (`/bdn`), with RTL/LTR.
- PostgreSQL schema and migrations (Drizzle).
- Admin sign-in with Argon2id passwords and **mandatory** 2FA (TOTP + one-time recovery codes).
- DB sessions scoped to `/admin`; idle and absolute timeouts; login rate limiting.
- Role-based access (OWNER, MANAGER, DESIGNER, SUPPORT), with admin user management.
- Append-only audit history, enforced by a database trigger.
- Security headers; `noindex` on admin, invitation, preview and receipt paths.
- Unit, integration and browser tests (360/390/430 px and desktop), and CI.

**Milestone M2 (admin catalog) is complete:**
- Sections with four-language names, image, ordering, archive/restore, default fields, and features required in every package.
- Field library with editable labels and length limits.
- Music library: MP3 upload, validation, preview, one file stored once, assignment to themes.
- Themes auto-registered from `themes/<key>/v<N>/`, with search/filter, settings, cover image, song, per-theme field labels and order, and versions.
- Packages (1–3) built from the theme's designed states, priced in IQD; every price change is audited.
- Theme lifecycle (development → review → on sale → archived/restored) with a readiness checklist; activated versions are frozen.

**Since M2:** an owner-set USD exchange rate (Admin → Website settings) lets visitors switch prices between IQD and USD next to the language choice. Payment is always IQD.

**Milestone M3 (theme engine) is complete:**
- Theme SDK (contract in [`docs/THEME_CONTRACT.md`](docs/THEME_CONTRACT.md)): music (tap to start, always loops), guest form, countdown, localized dates.
- Themes load lazily, one theme's code and styles per page; they render in an isolated layout with a platform-owned SAMPLE/PREVIEW label.
- Admin live preview for any package, language, name length, width and version.
- Automated validation of every theme state in 4 languages and 4 widths, with screenshots.
- Two internal demo themes exercise the contract; the first real theme comes from the owner's design.

**Milestone M5 (orders and invoices, backend) is complete:**
- Server validation of invitation details, drafts with a private 24-hour preview link, and checkout with an immutable order snapshot (safe against double taps).
- Gap-free invoice numbers on payment; automatic 30-day publication.
- Private receipt page with WhatsApp sharing; Admin → Orders.
- The customer-facing order screens follow once the storefront design is approved.

## Local development

Requirements: Node 22+, pnpm 10, PostgreSQL 16.

```bash
pnpm install
cp .env.example .env            # then fill TOTP_ENCRYPTION_KEY and IP_HASH_SALT (commands inside)
createdb bahja_dev && createdb bahja_test && createdb bahja_e2e_test
pnpm db:migrate && pnpm db:seed   # also registers themes found in themes/ and the starter sections
pnpm admin:create --email you@example.com --name "Your Name"   # prints a temporary password once
pnpm dev                        # http://localhost:3000 and http://localhost:3000/admin
```

At first sign-in the admin is asked to set up 2FA with an authenticator app, then to replace the temporary password.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` / `build` / `start` | Run, build and serve the app |
| `pnpm lint` / `typecheck` | ESLint / TypeScript |
| `pnpm test` | Unit and integration tests (uses `TEST_DATABASE_URL`, rebuilt each run) |
| `pnpm exec playwright test` | Browser tests (uses `E2E_DATABASE_URL`; set `PW_CHROMIUM_PATH` to use a preinstalled Chromium) |
| `pnpm i18n:check` | Translation parity and Kurdish approval status |
| `pnpm db:generate` | Create a migration from schema changes (`src/server/db/schema`) |
| `pnpm db:migrate` / `db:seed` | Apply migrations / sync permissions and built-in roles |
| `pnpm admin:create` | Create an admin user from the command line |

## Layout

```
src/app/[locale]/     storefront (localized)
src/app/admin/        admin panel (Arabic/English)
src/server/           business logic: db, auth, rbac, audit (never imported by client code)
src/i18n/             locales, routing, messages (ar/en/ckb/bdn)
src/components/       UI components (storefront, admin)
drizzle/              SQL migrations
tests/  e2e/          Vitest and Playwright tests
docs/                 architecture, theme guide, translations, runbooks
```

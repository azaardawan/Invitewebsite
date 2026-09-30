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

## Local development

Requirements: Node 22+, pnpm 10, PostgreSQL 16.

```bash
pnpm install
cp .env.example .env            # then fill TOTP_ENCRYPTION_KEY and IP_HASH_SALT (commands inside)
createdb bahja_dev && createdb bahja_test && createdb bahja_e2e_test
pnpm db:migrate && pnpm db:seed
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

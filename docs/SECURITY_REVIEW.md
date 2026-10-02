# Security review (M11, 2026-10-01)

Scope: the whole application as deployed on Railway staging. Automated checks run in CI (lint,
typecheck, unit/integration, e2e incl. axe and performance budgets).

## Verified
| Area | Status |
|---|---|
| Dependencies | `pnpm audit --prod`: no known vulnerabilities. |
| Admin auth | Argon2 passwords, mandatory TOTP 2FA, forced first password change, rate-limited sign-in, sessions in `HttpOnly; SameSite=Strict; Secure` cookies scoped to `/admin`. Every admin page/action calls `requireAdmin({ permission })`. |
| Audit | Important actions audited in the same transaction; `audit_logs` append-only (trigger); no secrets or message texts copied into audit values. |
| Private links | Receipt, preview and print tokens are HMAC/random, only hashes stored; print tokens expire after 5 minutes; receipts and invitations are `noindex`. |
| Public writes | Checkout, drafts, guest replies, PDF downloads and invitation misses are rate-limited per IP (hashed); guest replies also per invitation; optional Cloudflare Turnstile. Server-side validation of every field; live + package checks for guest replies. |
| Uploads | Admin only, same-origin check, size limits; images re-encoded by sharp, MP3 parsed; card PDFs parsed (A5 pages) and only ever served as downloads. |
| Output | React escaping everywhere; no `dangerouslySetInnerHTML` (ESLint); legal texts use a plain-text markup parser, never HTML. |
| Headers | CSP (scripts only from self + Turnstile, no plugins, framing self only; admin DENY), HSTS, nosniff, referrer policy, permissions policy. |
| Payments | Webhooks verified (HMAC), idempotent; payment state re-checked with WAYL, never trusted from redirects. |
| Errors | Unhandled server errors logged as one JSON line (no bodies, cookies or query strings). |

## Fixed in this review
- Admin session cookies were `Secure` only when `APP_ENV=production`; now on every https deployment.
- Contact page was pre-rendered at build time (would never show Admin contact details).
- Two accessibility issues (receipt page title, unlabeled theme links) and one contrast issue.

## Accepted / to do
- CSP still allows inline scripts (Next.js bootstrap). Nonce-based CSP is a later improvement.
- PDFs are stored in the same R2 bucket as public media under unguessable random keys; they are
  never linked publicly (always streamed through the receipt or Admin). A separate private bucket
  would be stricter.
- The app connects to Postgres as the owner role on staging. Before production, follow
  `docs/runbooks/database-roles.md` so the app cannot disable the audit-log trigger.
- Error alerts: logs only (Railway). Add Sentry later if alerts by email/phone are wanted.

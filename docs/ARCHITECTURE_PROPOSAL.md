# Architecture Proposal — Digital Invitation Platform (V1)

Status: **PROPOSAL — awaiting owner approval. No implementation has started.**
Date: 2026-09-28

---

## 1. System understanding

A curated invitation boutique. The platform runs the business: catalog, fields, packages, orders, WAYL payments, publication, expiry, RSVPs, messages, PDFs, analytics, audit, and admin. Themes handle only presentation: each one is a self-contained, mobile-first visual experience that receives sanitized data through a fixed contract.

```
Storefront (ar default, en, ckb, badini)          Admin (/admin, RBAC, 2FA)
   │ browse section → theme → sample preview            │ sections, fields, themes, packages,
   │ package → fields → personalized preview            │ music, orders, payments, invitations,
   │ customer info → legal accept → WAYL                │ RSVP/messages, translations, legal,
   ▼                                                    │ settings, analytics, audit
Platform core (Next.js server)  ◄───────────────────────┘
   ├─ Orders/Invoices (immutable snapshots)
   ├─ Payments (WAYL link create, webhook inbox, verify, reconcile)
   ├─ Publication (published_at, expires_at = +15d, derived expiry)
   ├─ Theme Engine (registry of versioned theme code, contract validation)
   ├─ RSVP / Congratulations (rate-limited public endpoints)
   └─ Jobs (PDF, reconciliation, cleanup) — Postgres-backed queue
Postgres (source of truth)      Object storage + CDN (music, images, PDFs)
```

Customer-facing routes:

| Route | Purpose | Indexed |
|---|---|---|
| `/`, `/en`, `/ckb`, `/bdn` | Home per locale (Arabic has no prefix) | yes |
| `/[locale]/occasions/[section]` | Section catalog | yes |
| `/[locale]/themes/[theme]` | Theme page + sample preview | yes |
| `/[locale]/themes/[theme]/order` | Package → fields → preview → checkout | no |
| `/p/[previewToken]` | Personalized pre-payment preview (short-lived) | no |
| `/r/[receiptToken]` | Private receipt/confirmation page | no |
| `/i/[slug]-[publicId]` | Public invitation | **no** (noindex header + meta, excluded from sitemap) |
| `/api/webhooks/wayl` | WAYL webhook | n/a |
| `/admin/**` | Admin | no, auth-gated |

---

## 2. Contradictions and decisions that need the owner

**A. 15-day lifetime vs the event date (the most important one).**
Expiry is `published_at + 15 days`, and payment publishes immediately. So a customer who pays 30 days before a wedding has a dead link 15 days before the event. Customers will do this, and it will create support load and refund disputes.
Options:
1. Keep the rule strictly. Checkout shows the computed expiry date and blocks, or warns, when `event_date > expiry`. This is the simplest option and needs no rule change.
2. **(Recommended)** Keep "15 days from publication" but let the customer pick a **go-live date** (today by default, never later than the event date). Payment is verified immediately, the order becomes `PAID`, and publication happens automatically at the chosen date. The rule is preserved; only *when* publication happens changes.
3. `expires_at = max(published_at + 15d, event_date + 1d)`. This changes the business rule.

**B. Theme code cannot be added "without rebuilding the application."**
Sections, packages, prices, fields, labels, music, ordering, translations and legal content are all managed from Admin with no rebuild. **Theme code** (unique layouts and animations) is executable code. Loading arbitrary JS uploaded at runtime into production is a real security and stability risk (supply-chain issues, XSS reaching admin sessions, no review). Recommendation: theme code ships through git → CI checks → a zero-downtime deploy (minutes). Admin then registers or activates the deployed version. Signed, pre-built theme bundles hosted on the CDN can come later if deploy frequency becomes a bottleneck.

**C. Invoice number used as the WAYL reference.**
If an invoice number is created at checkout start, abandoned checkouts consume numbers and leave gaps. Accountants and tax authorities often expect gap-free invoice sequences. Recommendation:
- `order_number` (e.g. `ORD-7K2P9X4M`, random) is created at checkout and used as the WAYL `referenceId`.
- `invoice_number` (`INV-2026-00184`, gap-free sequence per year) is assigned **in the same transaction that marks the order PAID**.
Both are shown on the receipt. If you prefer a single number, I can do that; gaps will then exist.

**D. The customer has no way back to their receipt or link once they leave the page.**
There are no accounts and cookies are not a security mechanism, so the post-payment page gets a private `/r/[token]` URL (256-bit random token, only a hash is stored). That URL is shown on screen and included in the prepared WhatsApp message. **Recommendation: also send one transactional email** with the receipt link (Resend or Postmark, costs cents). You are already collecting email; without it, a customer whose browser dies after the WAYL redirect has nothing. Please confirm.

**E. RSVP guest identity.**
With only "attending / not attending" and no name, the couple gets anonymous counts. Recommendation: guest name is required and attending/not attending is chosen. Guest count is **not** included in V1. Please confirm.

**F. Badini script and locale code.**
Badini is usually written in Arabic script in Duhok, but Latin script is also used. Please confirm **Arabic script** (RTL). Internal locale codes: `ar`, `en`, `ckb` (Sorani), and `bdn` as an internal code (displayed as "بادینی"; the BCP-47 tag in `lang` would be `kmr-Arab`). Fonts must cover Kurdish letters (ڕ ۆ ێ ڵ ە ڤ). Many "Arabic" web fonts do not, so fonts will be checked for this.

**G. Music replacement and existing invitations.**
Following the versioning principle, an invitation **snapshots its music track** at publication. Replacing a theme's song affects new invitations only. Admin can still change a specific invitation's track, and that change is audited. Please confirm.

**H. Short invitation IDs are guessable.**
The example `X7K2P` has 5 characters, about 33 million combinations, which a script can enumerate. Recommendation: a 10-character Crockford base32 public ID (about 50 bits), plus rate limiting on `/i/*` misses.

**I. Arabic and Kurdish names in URL slugs.**
Unicode slugs show up as `%D8%A3%D8%AD...` when copied into WhatsApp and many apps. Recommendation: ASCII slugs. Latin-script names are used as typed. Arabic and Kurdish names are transliterated with a conservative rule table (أحمد → ahmad). If that yields nothing usable, the URL is ID-only (`/i/x7k2p9qd4m`). The ID is authoritative. A wrong or old slug returns a 301 redirect to the canonical URL, so admin name edits never break links.

**J. Personalized preview can be abused as a free invitation.**
Anything rendered in a browser can be screenshotted, so a watermark alone is not security. Controls:
- The preview token expires 24h after the last edit.
- A platform-owned PREVIEW overlay that themes cannot remove.
- RSVP and congratulations endpoints reject any invitation not in `PUBLISHED` state, server-side.
- No OG and noindex.
- Per-token view rate limit.

This removes the practical value of sharing a preview link. It cannot stop screenshots, and nothing can.

**K. Collection period for congratulations messages.**
Messages can only be written while the invitation is public, so the collection period equals the publication window. The keepsake PDF is generated automatically at expiry, and Admin can regenerate it at any time.

**L. Price or theme changes during checkout.**
Price, package, fields and theme version are snapshotted when the order is created. If a theme is archived or re-priced after a WAYL link is issued, that order is honored at the snapshotted price until the link expires. After that, the customer must restart and sees current availability.

---

## 3. Recommended technical stack

| Concern | Choice | Why |
|---|---|---|
| App framework | **Next.js (App Router) + TypeScript**, a single app | SSR for SEO pages, per-invitation OG tags and noindex headers. Route handlers for the WAYL webhook. Per-route code splitting, so each invitation loads only its own theme bundle. One deployable. Very well-trodden for AI-assisted development. |
| Database | **PostgreSQL 16** (managed: Neon, Supabase-hosted Postgres, or Render/Railway PG) | Relational integrity, transactions, row locks for idempotent payment handling, partial unique indexes, JSONB for validated snapshots. |
| ORM / migrations | **Drizzle ORM** + SQL migrations | SQL-close and type-safe. Check constraints, partial indexes, grants and triggers (audit immutability) are written as plain SQL in migrations rather than fought through an abstraction. |
| Background jobs | **pg-boss** (queue inside Postgres) | PDF generation, payment reconciliation, scheduled publication, cleanup. No Redis and no extra service. |
| Object storage / CDN | **Cloudflare R2** + Cloudflare CDN | S3 API, **no egress fees** (music is streamed repeatedly), good edge presence for Iraq. Signed upload URLs for admin uploads only. |
| Hosting | **One container host** (Render, Railway or Fly; Frankfurt or nearby region) running a `web` process and a `worker` process from the same image, with Cloudflare in front | PDF generation needs headless Chromium, which is awkward on serverless. Long webhook and reconciliation jobs are simpler on containers. Predictable cost. |
| Styling (platform) | **Tailwind CSS** using logical properties (`ms-*`, `ps-*`, `start-*`) | RTL/LTR from one codebase, small CSS output. |
| Styling (themes) | **CSS Modules** scoped under a theme root; no global CSS | Isolation (see §6). |
| Animation | CSS and the Web Animations API by default. **GSAP** (free) only inside themes that need it, code-split. | No animation library on storefront pages that don't need one. |
| i18n | **next-intl**, with messages loaded from DB-backed translations and a static fallback | RTL/LTR, ICU plurals, server components. Admin-editable. |
| Validation | **Zod**, shared client and server | Package field validation is enforced on the server. |
| Admin auth | Custom DB sessions (httpOnly, Secure, SameSite=Strict cookie) + **Argon2id** + **TOTP 2FA** (required for OWNER) | Admin only, no OAuth or customer accounts, so a small auditable module beats a large framework. |
| PDF | **Playwright/Chromium** rendering a dedicated print-HTML template per theme | Correct Arabic and Kurdish shaping and RTL. React-PDF and pdfkit handle Arabic shaping poorly. |
| Rich text (legal) | TipTap in Admin → stored as JSON → rendered to sanitized HTML on the server | No raw HTML injection. |
| Email (if approved) | Resend or Postmark | One transactional receipt email. |
| Bot protection | Rate limits (Postgres/Cloudflare) + **Cloudflare Turnstile** on RSVP and message forms | Invisible, lightweight, privacy-respecting. |
| Monitoring | **Sentry** (errors) + structured JSON logs (pino) | |
| Tests | **Vitest** (unit/integration against real Postgres) + **Playwright** (E2E at 360/390/430 px) + a local **WAYL mock server** | |
| Package manager | pnpm | |

No microservices. There is one repo, one image and two processes.

---

## 4. Database / entity architecture

Conventions:
- UUID v7 primary keys.
- `created_at` and `updated_at` everywhere.
- Money is `bigint` IQD (no decimals).
- Enums are Postgres enums or check constraints.
- No hard delete on business entities; they use `status` / `archived_at`.

### Localized content
Two mechanisms, deliberately:
1. **UI strings**: `ui_translations(key PK, ar, en, ckb, bdn, needs_review_ckb bool, needs_review_bdn bool, updated_by, updated_at)`. This matches the requested key → 4-language shape and is editable in Admin. Missing or flagged Kurdish strings fall back to Arabic and show up in an Admin "needs translation" filter.
2. **Entity content** (section names, theme names, package names and descriptions, field labels): a `*_i18n jsonb` column such as `{"ar": "...", "en": "...", "ckb": null, "bdn": null}`, validated by Zod.

A single polymorphic `translations(entity_type, entity_id, ...)` table would lose foreign-key integrity and make every catalog query a join. JSONB on the row keeps each entity self-contained.

### Admin and RBAC
- `admin_users` (email unique, name, password_hash, totp_secret_enc, status ACTIVE/DISABLED, last_login_at)
- `roles` (key, name). Seeded: OWNER, MANAGER, DESIGNER, SUPPORT.
- `permissions` are **code-defined keys** (`payments.view`, `invitations.publish`, `users.manage`, …) seeded into a table.
- `role_permissions`, `admin_user_roles`
- `admin_sessions` (token_hash, user_id, ip, ua, expires_at, revoked_at)
- `auth_attempts` (rate limiting and lockout)

### Catalog
- `sections` (key, name_i18n, image_asset_id, status ACTIVE/ARCHIVED, sort_order)
- `field_definitions`: **the Field Library**. `key` is unique (`person_1_name`, `event_date`, `venue_map_url`, …). `type` is one of text/longtext/date/time/url/phone. `constraints` jsonb holds length, pattern and similar. `default_label_i18n`.
- `section_default_fields` (section_id, field_definition_id, sort_order, label_i18n override)
- `themes` (key, section_id, name_i18n, description_i18n, status DEVELOPMENT/READY_FOR_REVIEW/ACTIVE/ARCHIVED, sort_order, cover_asset_id, default_music_id, current_version_id)
- `theme_versions` (theme_id, version int, code_ref `royal-garden@2`, manifest_hash, manifest jsonb snapshot, status, released_at). **Immutable once any invitation references it.**
- `theme_fields` (theme_id, field_definition_id, sort_order, label_i18n override). Seeded from section defaults plus the manifest; Admin adjusts labels and order.
- `packages` (theme_id, name_i18n, description_i18n, price_iqd, sort_order, status ACTIVE/ARCHIVED). A check constraint limits each theme to at most 3 active packages.
- `package_fields` (package_id, field_definition_id)
- `package_features` (package_id, feature_key). Feature keys are **code-defined**: `rsvp`, `congratulations`, `keepsake_pdf`, `countdown`, `map`, `music`, plus any theme-specific optional sections declared in the manifest. Features carry platform logic, so they cannot be arbitrary DB rows.
- `music_tracks` (title, storage_key, mime, duration_s, size_bytes, status, uploaded_by)
- `assets` (storage_key, mime, width, height, bytes, variants jsonb): admin-uploaded images such as section and theme covers and OG images.

### Customers, orders, payments
- `customers` (name, phone_e164, email). One row per order, not deduplicated: without accounts, merging by phone would let anyone overwrite a stranger's record. A lookup index on phone serves Admin search.
- `orders`
  - `order_number` unique (random)
  - `invoice_number` unique nullable (gap-free, assigned on PAID)
  - `customer_id`, `invitation_id` (unique, 1:1 in V1)
  - status: `PENDING`, `AWAITING_PAYMENT`, `PAID`, `CANCELLED`, `PAYMENT_EXPIRED`, `REFUNDED`
  - `amount_iqd`, `currency` fixed to `IQD` by check constraint
  - **`snapshot jsonb`**: theme name, version, package name, price, enabled fields and features, customer info as entered
  - `receipt_token_hash`, `paid_at`
  - No `order_items` table in V1: an order has exactly one item and the snapshot captures it. This can be added when coupons or add-ons exist.
- `payments` (one row per WAYL link or attempt): order_id, provider `WAYL`, `provider_reference` unique, provider_link_id, checkout_url, amount_iqd, status (`CREATED`/`PENDING`/`SUCCEEDED`/`FAILED`/`EXPIRED`), verified_at, raw_create_response jsonb, raw_verify_response jsonb
- `payment_webhook_events` (**inbox**): provider, `dedupe_key` unique, raw_body, headers, signature_valid, received_at, processed_at, processing_result, error. Every delivery is stored first and processed second.
- `order_status_history` (order_id, from, to, actor_type SYSTEM/ADMIN/WEBHOOK, actor_id, reason, at)
- **Receipts are rendered from the immutable order snapshot plus the invoice number**, so there is no separate `receipts` table. Current prices are never read for a historical receipt.

### Invitations
- `invitations`
  - `public_id` unique (10-char base32), `slug`
  - status: `DRAFT`, `AWAITING_PAYMENT`, `PAID`, `PUBLISHED`, `UNPUBLISHED`
  - `theme_version_id` (FK, fixed), `package_id`, `music_track_id` (snapshot)
  - `invitation_locale`
  - **`field_values jsonb`**, validated on the server against the package's field set
  - `preview_token_hash`, `preview_expires_at`
  - `scheduled_publish_at`, `published_at`, `expires_at`
  - `unpublished_reason`, `version` int (optimistic locking for concurrent admin edits)
  - **EXPIRED is derived** (`status = PUBLISHED AND now() >= expires_at`), not a stored flip. There is no cron race: expiry is exact to the second, and extending it is a single update.
  - `field_values` is JSONB rather than an EAV `invitation_field_values` table because values are always read and written as a whole, validated as a whole, snapshotted and diffed for audit. EAV adds joins without adding integrity, since type integrity comes from the Zod schema either way.
- `rsvps` (invitation_id, guest_name, response ATTENDING/NOT_ATTENDING, ip_hash, client_token_hash, created_at). Dedupe uses a unique (invitation_id, client_token_hash) with upsert.
- `congratulation_messages` (invitation_id, guest_name, body ≤ 500 chars, status VISIBLE/HIDDEN, ip_hash, created_at)
- `keepsake_documents` (invitation_id, storage_key, theme_version_id, message_count, generated_at, generated_by, status)

### Content, legal, settings
- `website_settings`: a single typed JSONB row (business name, phone, WhatsApp, email, address, socials) with version history in the audit log
- `legal_policies` (type PRIVACY/TERMS/REFUND/CONTACT)
- `legal_policy_versions` (policy_id, version, content_i18n jsonb (TipTap JSON), published_at, created_by). Immutable once published.
- `legal_acceptances` (order_id, policy_version_id, accepted_at, ip_hash, user_agent)

### Analytics and audit
- `analytics_events` (bigserial)
  - name, occurred_at, anon_session_id (random, created per browser session; not personal data)
  - locale, device_class, referrer_host
  - section_id, theme_id, package_id, invitation_id, order_id (nullable FKs)
  - No IP, no names, no phone numbers.
  - Daily rollup table added when volume requires it.
- `audit_logs` (append-only)
  - actor_admin_id, actor_type, action, object_type, object_id, before jsonb, after jsonb, reason, ip, at
  - The application's DB role has **INSERT/SELECT only**; a trigger rejects UPDATE/DELETE. An optional hash chain (`prev_hash`) makes tampering evident.

### Key constraints and indexes
- Partial unique index: one `SUCCEEDED` payment per order.
- `invoice_number` comes from a per-year counter row updated with `UPDATE … RETURNING` inside the PAID transaction, so it is gap-free.
- Indexes on `invitations(public_id)`, `invitations(status, expires_at)`, `orders(status, created_at)`, and `analytics_events(name, occurred_at)`.

---

## 5. Project folder architecture

```
/
├─ src/
│  ├─ app/
│  │  ├─ [locale]/(storefront)/…      home, occasions, themes, order flow, legal pages
│  │  ├─ i/[slugId]/                   public invitation (noindex, OG)
│  │  ├─ p/[token]/                    personalized preview
│  │  ├─ r/[token]/                    private receipt
│  │  ├─ admin/…                       admin UI
│  │  ├─ api/webhooks/wayl/route.ts
│  │  ├─ api/public/{rsvp,messages,events}/route.ts
│  │  ├─ sitemap.ts, robots.ts
│  ├─ server/                          business logic (no React)
│  │  ├─ db/ (schema, migrations, client)
│  │  ├─ auth/ rbac/ audit/
│  │  ├─ catalog/ orders/ payments/wayl/ invitations/ rsvp/ keepsake/ analytics/ settings/ legal/
│  ├─ theme-sdk/                       THE CONTRACT: types, hooks, platform slot components
│  ├─ components/                      platform UI (storefront + admin)
│  ├─ i18n/                            config, loaders, static fallback messages
│  └─ lib/                             slug, ids, money, phone, whatsapp links
├─ themes/
│  ├─ royal-garden/
│  │  ├─ v1/  manifest.ts  Theme.tsx  theme.module.css  pdf/  assets/  README.md
│  │  └─ v2/  …
│  └─ registry.ts                      generated list of code_refs → lazy imports
├─ worker/                             pg-boss job handlers (pdf, reconcile, publish-scheduled, cleanup)
├─ scripts/                            theme:validate, theme:freeze, backup:verify, seed
├─ tests/ (unit, integration) · e2e/ (Playwright) · mocks/wayl/
└─ docs/                               architecture, theme contract, runbooks, retention, backups
```

---

## 6. Theme Engine and Theme Contract

**A theme version is a folder of code plus a manifest.** For example:

```ts
// themes/royal-garden/v1/manifest.ts
export default defineTheme({
  key: 'royal-garden', version: 1, sections: ['wedding'],
  fields: ['person_1_name','person_2_name','event_date','event_time','venue_name','venue_map_url','invitation_message'],
  features: ['music','countdown','map','rsvp','congratulations','keepsake_pdf'],
  // Every package combination Admin may configure must be a declared, designed state:
  validStates: [
    { features: ['music'], fields: ['person_1_name','person_2_name','event_date','event_time','venue_name'] },
    { features: ['music','countdown','map','rsvp'], fields: [...] },
    { features: '*', fields: '*' },            // complete theme = top package
  ],
  pdfCompanion: './pdf/Keepsake.tsx',
  budget: { jsKb: 80, initialImageKb: 400 },
  assets: { cover: './assets/cover.webp', og: './assets/og.jpg' },
});
```

**Runtime contract.** The platform passes exactly one prop object, and the theme renders it:

```ts
type ThemeProps = {
  mode: 'sample' | 'preview' | 'live';
  locale: 'ar'|'en'|'ckb'|'bdn'; dir: 'rtl'|'ltr';
  fields: Readonly<Record<FieldKey, string>>;   // already validated & sanitized; plain text only
  features: ReadonlySet<FeatureKey>;
  labels: Record<string,string>;                // localized strings the theme needs
  music: { src: string } | null;
};
```

The theme gets platform capabilities only through `theme-sdk`:
- `useMusic()`: play and pause, respects autoplay rules. The first "Open invitation" gesture unlocks audio.
- `<RsvpSlot render={…}/>` and `<CongratsSlot render={…}/>`: headless components. The theme supplies the markup and styling; the platform owns submission, validation, Turnstile and error states. In `sample` or `preview` mode they are inert.
- `useReducedMotion()`, `<ThemeImage>` (responsive, lazy), and `formatDate()` for the invitation's locale and calendar.

**Enforcement:**
- **Static.** An ESLint boundary rule: `themes/**` may import only from `theme-sdk`, React and approved libraries, never from `server/`, `db`, `fetch` or `cookies`. The CSS lint forbids global selectors (`:root`, `body`, bare tags) outside the theme root.
- **Build-time `theme:validate`.** Checks:
  - The manifest parses.
  - Fields exist in the Field Library.
  - The theme renders every `validStates` entry at 360, 390, 430 and 1280 px without errors.
  - Playwright screenshots of every state are saved for human review.
  - JS and image budgets are met; missing assets are reported.
  - The PDF companion renders with 0, 1 and 200 messages.
- **Runtime isolation.** The theme is rendered inside `<div data-theme-root>` with CSS Modules. `/i/*` pages include no storefront CSS. Sample previews in the storefront and admin run in a sandboxed **iframe** so theme CSS and JS can never affect the platform page.
- **Admin package editor.** It only allows feature and field combinations that match a declared `validStates` entry. This enforces "remain visually intentional when features are removed."
- **Security.** Field values are rendered as text; no theme gets `dangerouslySetInnerHTML` (lint rule). URLs such as the map link are validated against an allowlist (Google Maps, Apple Maps and similar) on the server.

**Versioning.** `invitations.theme_version_id` is fixed at purchase. When a version first gets a paid invitation, `theme:freeze` records a content hash of its folder in `themes/frozen.json`. CI fails if a frozen folder changes. Any change means copying to `v2/`, which then goes through DEVELOPMENT → READY_FOR_REVIEW → ACTIVE. Old version folders are never deleted while invitations reference them.

**Performance.** Each version is lazy-imported through the generated registry, so a visitor to `/i/x` downloads only that theme's chunk. Storefront theme cards use a static WebP or AVIF cover plus an optional short muted MP4 or WebM loop that loads only when in view, and only one plays at a time.

## 7. How themes are added safely

1. The designer supplies the reference design and exported layered assets (see §11).
2. The developer (or an AI agent) creates `themes/<key>/v1`, implements it against the SDK, and runs `pnpm theme:validate`.
3. A PR goes through CI (lint boundaries, validation, screenshots of every state, budgets). After merge and deploy, the version appears in Admin as **DEVELOPMENT**.
4. Admin assigns the section, labels, packages, prices, features and music, then previews every package on mobile and desktop and marks it **READY_FOR_REVIEW**.
5. The OWNER or MANAGER completes the package-validation checklist (§63 of the spec) and sets it **ACTIVE**, which puts it in the storefront.
6. Archiving hides the theme from the storefront. Existing invitations keep rendering, and restore is one click. Themes with purchases can never be hard-deleted (foreign key plus UI rule).

---

## 8. WAYL payment lifecycle

**What I could confirm** from public sources:
- A REST API authenticated with an `X-WAYL-AUTHENTICATION` merchant token.
- Payment **links** are created with a merchant `referenceId`.
- `webhookUrl` and `webhookSecret` are set per link, with deliveries signed by **HMAC-SHA256** in an `x-wayl-signature-256` header.
- An official reference exists at api.thewayl.com, with support at jisr@wayl.io.

**Still to confirm** from the official docs:
- Exact endpoint paths.
- Status values.
- Whether a link can be fetched by `referenceId` (needed for independent verification).
- Redirect query parameters.
- Link expiry.
- Test/sandbox mode behaviour.
- Retry policy.
- Refunds.

The sandbox blocked access to wayl.io and api.thewayl.com, so nothing below depends on guessed field names. The integration will live behind one `WaylClient` interface. Code will not be finalized until it has been read against the official docs and exercised in WAYL test mode.

```
1. Customer taps Pay
   └─ POST /api/checkout  (idempotency key from the form; double-tap returns the same result)
      TX: lock invitation row → validate fields against package snapshot → legal acceptance recorded
          → order (PENDING, snapshot, amount) → invitation AWAITING_PAYMENT
2. Server → WAYL: create link {referenceId = order_number[-attemptN], amount IQD, webhookUrl, webhookSecret, redirectionUrl=/checkout/return?o=<order_number>}
   store payment(CREATED, provider_reference, link id) → order AWAITING_PAYMENT → redirect customer
   (if an unexpired link already exists for this order, reuse it; no duplicate charges)
3. Customer pays on WAYL
4a. Webhook → /api/webhooks/wayl
    - read RAW body, constant-time verify HMAC; invalid → 401, stored as signature_valid=false
    - INSERT into payment_webhook_events ON CONFLICT(dedupe_key) DO NOTHING → duplicate = 200 no-op
    - respond 200 quickly; enqueue processing job
4b. Processing (worker, idempotent):
    - re-fetch payment state from WAYL by reference (never trust payload alone)
    - verify amount == snapshot amount, currency == IQD, reference matches order
    - TX: SELECT … FOR UPDATE order; if already PAID → no-op
          payment SUCCEEDED; order PAID + invoice_number assigned; status history
          invitation → PUBLISHED, published_at=now(), expires_at=now()+15d
          (or scheduled_publish_at if Decision A option 2)
          audit + analytics(payment_success, invitation_published)
    - after commit: send receipt email (if approved)
5. Customer returns to /checkout/return
   - The redirect is NOT proof. The page shows "Confirming payment…". The server performs the
     same verification as 4b immediately (covers a delayed webhook), then polls order status.
   - PAID → confirmation (invoice, receipt link /r/token, URL, dates, Copy, WhatsApp, Open)
   - still pending after ~60s → "Payment is being confirmed; bookmark this page", with the /r/token link
6. Reconciliation job every 10 min: orders AWAITING_PAYMENT < 48h old → query WAYL → fix stragglers.
7. Admin manual publish: permission `invitations.publish.manual`, mandatory reason, same row lock,
   never alters payment rows, audited. If a webhook later confirms payment, it links to the order
   without re-publishing or resetting expires_at.
```

Failure modes covered:
- Double tap
- Duplicate webhook
- Webhook before redirect
- Redirect before webhook
- Admin and webhook racing (row lock plus "already PAID → no-op")
- Refresh of the confirmation page (read-only)
- WAYL unavailable at link creation (friendly retry; the order stays PENDING)
- Theme archived mid-checkout (Decision L)
- Paid but publish failed (the payment is committed in its own step; publication is retried by the job and flagged on the Admin dashboard)

---

## 9. Security-sensitive areas

- **Admin auth**
  - Argon2id hashing and TOTP 2FA.
  - Session rotation on login and privilege change.
  - Lockout and backoff on failed logins.
  - Every server action checks a permission (`requirePermission`), not just "is logged in".
- **IDOR**
  - Public resources are addressed only by random IDs or tokens: public_id, preview token, receipt token.
  - Order and invoice numbers never authorize anything.
- **Payments**
  - Signature verification on the raw body.
  - Independent status re-fetch.
  - Amount and currency check.
  - Idempotent inbox.
  - Secrets stay server-only; env vars are validated at boot.
- **XSS**
  - React escaping, no `dangerouslySetInnerHTML` in themes.
  - Legal rich text rendered from TipTap JSON through a sanitizer.
  - Strict CSP with nonces.
  - Map URLs checked against an allowlist.
- **CSRF**: SameSite=Strict admin cookie, Origin checks on server actions and route handlers.
- **SQL injection**: parameterized queries via Drizzle only.
- **Uploads**
  - Admin-only.
  - MIME sniffing plus an extension allowlist and size caps.
  - Images re-encoded (sharp) and SVG sanitized (or disallowed for admin uploads).
  - Presigned uploads land in a private bucket.
- **Abuse**
  - RSVP and messages: Turnstile, per-IP and per-invitation rate limits, length limits, and Admin hiding of messages.
  - Checkout creation is rate-limited.
  - `/i` 404s are rate-limited to slow enumeration.
- **Headers**: HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`, and `X-Robots-Tag: noindex` on `/i`, `/p`, `/r` and `/admin`.
- **Errors**: generic customer messages, details go to Sentry with PII scrubbing, and there are no stack traces in responses.
- **Audit log**: DB-level append-only.
- **Environments**: production and staging are separated (different DB, bucket and WAYL keys).

---

## 10. Data retention (initial proposal; legal review required)

| Data | Public lifetime | Retained | Then |
|---|---|---|---|
| Invitation page | 15 days after publication (plus extensions) | Record kept 24 months after expiry | Field values anonymized; record stub kept |
| RSVP / messages | Readable by Admin | 12 months after expiry (keepsake PDF produced first) | Deleted |
| Keepsake PDF | Admin download | 12 months after expiry | Deleted from storage |
| Orders, invoices, payments, legal acceptances | — | 7 years (typical accounting horizon; confirm the Iraqi requirement) | Archived |
| Customer contact info | — | Same as the order | Anonymized with the order |
| Unpaid drafts and previews | Preview 24h | 30 days | Deleted |
| Analytics events | — | 13 months raw | Aggregates kept |
| Audit logs | — | 7 years | — |
| Webhook raw payloads | — | 12 months | Deleted (the payment row is kept) |

Implemented as a scheduled cleanup job. Every period lives in one config file and is reflected in the Privacy Policy.

---

## 11. Milestones

Each milestone ends with a demo and a checklist before the next one starts.

| # | Milestone | Spec phases | Exit criteria |
|---|---|---|---|
| M0 | Approval of this document | 1–3 | Decisions A–L answered |
| M1 | Foundation | 4 | Repo, CI, Drizzle schema and migrations, env validation, i18n with RTL, admin login + 2FA + RBAC, audit log, seed data, Sentry |
| M2 | Admin catalog | 5–6 | Sections, Field Library, themes/versions registry, packages (with validStates enforcement), music library, R2 uploads, ordering |
| M3 | Theme engine + first theme | 8 | theme-sdk, registry, validate/freeze scripts, one reference theme in all its package states |
| M4 | Storefront | 7 | Home skeleton (awaiting the design), occasions, catalog, theme page with sample preview, SEO, sitemap, robots |
| M5 | Personalization → order | 9–10 | Field forms, server validation, personalized preview, customer info, legal acceptance, order snapshot, receipt page |
| M6 | WAYL | 11–12 | Client against the official docs, mock server, sandbox tests, webhook inbox, verification, publication, reconciliation, manual publish |
| M7 | Invitation runtime | 13 | `/i` routing, canonical slug redirects, expiry page, OG, noindex, admin invitation view/edit/extend/unpublish |
| M8 | Guest features | 14–15 | RSVP, congratulations, moderation, keepsake PDF companion and jobs |
| M9 | Analytics + dashboard | 16 | Event capture, dashboard metrics |
| M10 | Legal, settings, contact, WhatsApp | 17 | Editable policies with versions, settings-driven footer and contact, WhatsApp flows |
| M11 | Hardening | 18–19 | Lighthouse/WebPageTest on real 4G profiles, axe accessibility, security review, backup + **tested restore**, runbooks |
| M12 | Staging → production | 20–23 | Staging on a temporary domain, WAYL production validation with a real small payment, domain/DNS/HTTPS, launch checklist |

Tests are written inside each milestone. Coverage focuses on payment verification, webhook idempotency, state transitions, publication and expiry, RBAC, package field validation, theme availability, invoice totals, URL resolution and RSVP. The full E2E journey runs against the WAYL mock in CI and against WAYL test mode manually before M12.

---

## 12. What is needed from the owner

**Needed now** (to start M1–M3):
1. Approval of this architecture, or changes to it.
2. Answers to decisions **A, C, D, E, F, G** (the others have defaults I will apply unless you object).
3. A working brand or business name (it can change later).
4. WAYL: a merchant account and **test-mode API token**, access to the official API reference, and your merchant dashboard settings. Also allow `wayl.io` and `api.thewayl.com` in this environment's network access so I can read the docs directly. They are currently blocked by the environment's network policy.

**Needed by M3/M4:**
- The first theme's design reference plus exported layered web assets (separate PNG/WebP/SVG for anything that moves), its interaction notes, and which features each package removes.
- Homepage design reference(s).
- One or more MP3s for the music library.

**Can wait:**
- Hosting, R2 and Sentry accounts (local development uses Docker Postgres and MinIO)
- The domain
- Production WAYL keys
- The business WhatsApp number and email
- Legal text review by an Iraqi lawyer (I will draft the policies from the actual system behaviour)
- Kurdish (Sorani/Badini) translator
- Email provider account (if D is approved)

## Sources
- [Wayl Checkout – WordPress plugin](https://wordpress.org/plugins/wayl-checkout/)
- [Wayl API — Integration guide](https://wayl.io/docs)
- [Wayl API reference (Context7 index)](https://context7.com/websites/api_thewayl_reference)
- [Wayl MCP (Glama)](https://glama.ai/mcp/servers/muthanii/waylMCP)

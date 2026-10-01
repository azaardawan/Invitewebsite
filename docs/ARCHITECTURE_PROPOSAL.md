# Architecture Proposal — Bahja (بهجه) Digital Invitation Platform (V1)

Status: **APPROVED — revision 8. M1–M3 implemented; M5 (orders and invoices) backend implemented.**
Date: 2026-09-30

**Revision 8 changes (M5 implementation notes):**
- **Drafts.**
  - Customer details are validated on the server: every package field is required, dates are in Baghdad time (not in the past, at most 2 years ahead), map links are checked, and Arabic-Indic digits are accepted.
  - A draft is stored as an invitation with a private preview link (`/p/<token>`, valid 24 h after the last edit, PREVIEW label, `noindex`).
- **Checkout.** It creates one order with an immutable snapshot (theme, exact version, package, price, fields, customer, and the display exchange rate).
  - A double tap or a second tab returns the same order: there is an idempotency key, plus a database rule allowing one open or paid order per invitation.
  - Availability and price are re-checked at checkout. If the theme was archived or the package changed since the draft, checkout is refused.
- **Payment confirmation (`markOrderPaid`).** One transaction with a row lock does all of this:
  - assigns a gap-free `INV-YYYY-00001` (per Baghdad year);
  - publishes the invitation for exactly 30 days;
  - records status history and audit entries.

  It is idempotent: duplicate webhooks, redirect checks, or a manual publish racing a webhook all end in one invoice and one publication. Manual publication requires the admin and a reason. The WAYL wiring arrives in M6.
- **Private receipt (`/r/<token>`).** The token is derived with HMAC from `TOKEN_SECRET`, so a retried checkout returns the same link without storing it. It is rendered only from the snapshot, and knowing an order or invoice number grants nothing.
  - The page offers copy link, WhatsApp share, a WhatsApp confirmation to self, and print.
- **Admin → Orders:** search and filter. Phone and email are masked for staff without `customers.view`.
- **Rate limits** (fixed window, in Postgres) on draft creation and checkout per visitor.
- **Legal acceptance** is recorded with placeholder policy versions (`draft-2026-09`) until Admin-managed legal policies exist (M10).
- **Customer screens** (personalization form, checkout) are built in the approved v2 storefront design (M4).

**Revision 7 changes (M3 implementation notes):**
- **Theme SDK and contract implemented.**
  - The developer contract is `docs/THEME_CONTRACT.md`.
  - Music starts on the "Open invitation" tap, always loops, and pauses when the phone locks.
  - Also included: a headless guest form, countdown, reduced motion, and localized dates (Badini uses owner-approved month names).
- **Per-theme loading.**
  - Each theme version is a separate lazy chunk (JS and CSS); an invitation page loads only its own theme.
  - A test proves this, and also proves no platform styles are loaded.
- **Invitation pages have their own minimal root layout.** Admin pages moved under `app/admin/(shell)` so previews under `/admin/preview` (where the admin cookie applies) can use one.
- **Admin preview panel** (isolated iframe): switch package or state, language, name length, width and version.
- **Automated validation** (`e2e/themes.spec.ts`) covers every state × language × name length × width, plus behaviour checks. Screenshots are uploaded by CI for review.
- The **registry generator** rejects theme CSS with global selectors, and themes without `Theme.tsx`.

**Revision 6 changes (owner feedback after M2):**
- **Currency (Decision N):** all payments in IQD. An owner-set exchange rate lets visitors view prices in USD, with the switch next to the language choice.
- **Music loops** automatically; one song can be assigned to any number of themes.

**Revision 5 changes (M2 implementation notes):**
- **Owner approval for design.** The storefront's visual design will be presented for approval before it is built (M4); admin screens stay functional.
- **Section rule:** "features included in every package" (`sections.required_features`) enforces decision M. Wedding requires `print_card`; a wedding theme designed without a printable card cannot be sold.
- **Package editor:** a package is created by choosing one of the theme's **designed states** (from its manifest), so invalid combinations can't be configured.
- **Field Library:** field keys and types are defined in code (themes render them), while labels and length limits are editable in Admin, including Kurdish.
- **Internal demo theme** (`themes/demo-wedding`) exists for development and tests; it can only be activated when `APP_ENV=development`.
- **Uploads** go through a dedicated admin route. Images are re-encoded to WebP with metadata such as GPS removed; MP3s are verified by parsing; SVG uploads are refused.

**Revision 4 changes (owner feedback at approval):**
- A **future section with a different format** is planned, where people add **pictures and messages**. The architecture reserves room for it (§13), but none of it is built yet.
- **Kurdish translations are owner-approved only.** New strings get suggested Sorani/Badini wording in `docs/translations/KURDISH_REVIEW.md`; nothing Kurdish ships until the owner approves it.
- The **admin panel is Arabic/English only** (staff tool); Kurdish applies to all customer-facing pages.

**Revision 3 changes:**
- A: no go-live date; publish immediately for 30 days; extensions by Admin on request.
- C: separate order and invoice numbers, as recommended.
- M: every Wedding package includes the printable card; other sections can enable it later from Admin.

**Revision 2 changes (owner feedback):**
- Public lifetime is now **30 days** from publication.
- New **printable invitation card** per theme (Decision M).
- D, E, F and G are confirmed.
- RSVP and messages are merged into **one guest form**: name, attending / not attending, message.
- Working brand name: **Bahja / بهجه**.
- Theme isolation guarantees are now spelled out in §7.1.
- Step-by-step theme guide added: `docs/THEME_GUIDE.md`.

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
   ├─ Publication (published_at, expires_at = +30d, derived expiry)
   ├─ Theme Engine (registry of versioned theme code, contract validation)
   ├─ Guest responses: name + attendance + message (rate-limited public endpoint)
   ├─ Print documents: printable invitation card + keepsake PDF (per-theme print companions)
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

**A. ✅ DECIDED — publish immediately, 30 days, extensions on request.**
There is no go-live date. Verified payment publishes the invitation at once, with `expires_at = published_at + 30 days`. If a customer needs longer, they contact Bahja and Admin extends it (audited, with a reason).
To avoid surprises, the checkout and the receipt both show the exact expiry date. If the entered `event_date` is later than that expiry, checkout shows a short note: *"Your invitation will be live until X. Contact us if you need an extension."* This is informational only and never blocks payment.

**B. Theme code cannot be added "without rebuilding the application."**
Sections, packages, prices, fields, labels, music, ordering, translations and legal content are all managed from Admin with no rebuild. **Theme code** (unique layouts and animations) is executable code. Loading arbitrary JS uploaded at runtime into production is a real security and stability risk (supply-chain issues, XSS reaching admin sessions, no review). Recommendation: theme code ships through git → CI checks → a zero-downtime deploy (minutes). Admin then registers or activates the deployed version. Signed, pre-built theme bundles hosted on the CDN can come later if deploy frequency becomes a bottleneck.

**C. ✅ DECIDED — separate order number (WAYL reference) and gap-free invoice number.**
If an invoice number is created at checkout start, abandoned checkouts consume numbers and leave gaps. Accountants and tax authorities often expect gap-free invoice sequences. Recommendation:
- `order_number` (e.g. `ORD-7K2P9X4M`, random) is created at checkout and used as the WAYL `referenceId`.
- `invoice_number` (`INV-2026-00184`, gap-free sequence per year) is assigned **in the same transaction that marks the order PAID**.
Both are shown on the receipt. 

**D. ✅ CONFIRMED — private receipt URL + one transactional email.**
There are no accounts and cookies are not a security mechanism, so the post-payment page gets a private `/r/[token]` URL (256-bit random token, only a hash is stored). That URL is shown on screen and included in the prepared WhatsApp message. **Recommendation: also send one transactional email** with the receipt link (Resend or Postmark, costs cents). You are already collecting email; without it, a customer whose browser dies after the WAYL redirect has nothing.

**E. ✅ CONFIRMED — one guest form.** The guest writes their **name** (required), chooses **attending / not attending** (required) and writes a **message to the couple**. The message is required when the package includes the `congratulations` feature; without that feature the form has only name + attendance. Messages feed the keepsake PDF. Guest count is not included in V1.

**F. ✅ CONFIRMED — Arabic script, and every font must support Kurdish letters.**
Badini is usually written in Arabic script in Duhok, but Latin script is also used. Confirmed: **Arabic script** (RTL). Internal locale codes: `ar`, `en`, `ckb` (Sorani), and `bdn` as an internal code (displayed as "بادینی"; the BCP-47 tag in `lang` would be `kmr-Arab`). Fonts must cover Kurdish letters (ڕ ۆ ێ ڵ ە ڤ). Many "Arabic" web fonts do not, so fonts will be checked for this.

**G. ✅ CONFIRMED — invitations snapshot their song.**
Following the versioning principle, an invitation **snapshots its music track** at publication. Replacing a theme's song affects new invitations only. Admin can still change a specific invitation's track, and that change is audited.

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

**K. Collection period for messages (30 days).**
Messages can only be written while the invitation is public, so the collection period equals the publication window. The keepsake PDF is generated automatically at expiry, and Admin can regenerate it at any time.

**L. Price or theme changes during checkout.**
Price, package, fields and theme version are snapshotted when the order is created. If a theme is archived or re-priced after a WAYL link is issued, that order is honored at the snapshotted price until the link expires. After that, the customer must restart and sees current availability.

**N. ✅ DECIDED — Pay in IQD; show USD as an option.**
- **Every payment is charged in Iraqi dinars**, including future Mastercard payments through WAYL. Package prices are set by the owner in IQD only.
- The owner sets **one exchange rate** (IQD per 1 USD) in Admin → Website settings. It is audited on every change; leaving it empty hides the USD option.
- Visitors can switch the display between **IQD and USD next to the language choice**. USD amounts are shown as approximate (≈) with the note "payment is made in Iraqi dinars".
- The preference is kept in the visitor's browser only, as a convenience. It never affects the amount charged.
- **Orders (M5)** snapshot the IQD amount charged. If the checkout shows a USD approximation, the exchange rate used is snapshotted too, so the receipt can show it.
- An earlier per-package USD price (added briefly) was removed by migration `0005` in favour of this simpler model.

**M. ✅ DECIDED — Printable invitation card.**
Every theme ships a **print companion**: a static, print-ready design of the same visual identity. It is not a screenshot of the animated page.
- **What the customer gets.** After payment, the receipt page (`/r/<token>`) and the receipt email have a **Download printable card (PDF)** button. It uses the same names, date, venue and text as the online invitation, in the invitation's language.
- **Print specifications**, declared per theme in the manifest:
  - one finished size per theme (default **A5, 148×210 mm**; 5×7 in is allowed);
  - **3 mm bleed** and a 5 mm safe area;
  - artwork supplied at **300 dpi** at the printed size;
  - fonts embedded in the PDF;
  - optional crop marks for print shops.
- **Colour.** Chromium produces RGB PDFs. Most local print shops accept RGB. If a shop needs CMYK, a conversion step (Ghostscript + ICC profile) can be added. Designers should keep print colours CMYK-safe because very saturated RGB colours shift in print.
- **QR code (default on; can be turned off per theme).** The card can carry a QR code to the online invitation. After 30 days the QR opens the branded "invitation ended" page, never an error.
- **Preview.** Before payment, the personalized preview shows a low-resolution, watermarked card. The full-resolution PDF exists only after payment, and is served only through the private receipt token or from Admin.
- **Regeneration.** The PDF is generated by the worker after publication. If Admin edits the invitation, `source_hash` changes and the card is regenerated automatically. Admin can also regenerate or download it at any time.
- **Package control (decided).**
  - The card is designed as part of the complete (VVIP) theme.
  - **Every Wedding package includes it.** The Wedding section's default feature set has `print_card` turned on, so every new Wedding package gets it automatically.
  - For other sections it stays an ordinary per-package feature, off by default. If you later decide Graduation or Birthday themes should have one, you switch it on in Admin with no code change; that section's themes just need a print companion design.

---

## 3. Recommended technical stack

| Concern | Choice | Why |
|---|---|---|
| App framework | **Next.js (App Router) + TypeScript**, a single app | SSR for SEO pages, per-invitation OG tags and noindex headers. Route handlers for the WAYL webhook. Per-route code splitting, so each invitation loads only its own theme bundle. One deployable. Very well-trodden for AI-assisted development. |
| Database | **PostgreSQL 16** (managed: Neon, Supabase-hosted Postgres, or Render/Railway PG) | Relational integrity, transactions, row locks for idempotent payment handling, partial unique indexes, JSONB for validated snapshots. |
| ORM / migrations | **Drizzle ORM** + SQL migrations | SQL-close and type-safe. Check constraints, partial indexes, grants and triggers (audit immutability) are written as plain SQL in migrations rather than fought through an abstraction. |
| Background jobs | **pg-boss** (queue inside Postgres) | PDF generation, payment reconciliation, cleanup. No Redis and no extra service. |
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
- `sections` (key, name_i18n, image_asset_id, status ACTIVE/ARCHIVED, sort_order, **`experience_type`** — `INVITATION` in V1; see §13)
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
  - `published_at`, `expires_at`
  - `unpublished_reason`, `version` int (optimistic locking for concurrent admin edits)
  - **EXPIRED is derived** (`status = PUBLISHED AND now() >= expires_at`), not a stored flip. There is no cron race: expiry is exact to the second, and extending it is a single update.
  - `field_values` is JSONB rather than an EAV `invitation_field_values` table because values are always read and written as a whole, validated as a whole, snapshotted and diffed for audit. EAV adds joins without adding integrity, since type integrity comes from the Zod schema either way.
- `guest_responses` (invitation_id, guest_name, attendance ATTENDING/NOT_ATTENDING, message nullable ≤ 500 chars, message_status VISIBLE/HIDDEN, ip_hash, client_token_hash, created_at, updated_at). This replaces separate RSVP and message tables because the guest fills in one form. A unique (invitation_id, client_token_hash) with upsert lets a guest correct their own answer from the same device without creating duplicates.
- `generated_documents` (invitation_id, type PRINT_CARD/KEEPSAKE_PDF, variant e.g. `A5`/`5x7`, storage_key, theme_version_id, source_hash, message_count, generated_at, generated_by, status). `source_hash` tells us when a document is stale after an admin edit.

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
├─ worker/                             pg-boss job handlers (pdf, reconcile, cleanup)
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
  features: ['music','countdown','map','rsvp','congratulations','keepsake_pdf','print_card'],
  // Every package combination Admin may configure must be a declared, designed state:
  validStates: [
    { features: ['music'], fields: ['person_1_name','person_2_name','event_date','event_time','venue_name'] },
    { features: ['music','countdown','map','rsvp'], fields: [...] },
    { features: '*', fields: '*' },            // complete theme = top package
  ],
  print: {
    card:     { component: './print/Card.tsx', size: 'A5', bleedMm: 3, qr: true },
    keepsake: { component: './print/Keepsake.tsx', size: 'A4' },
  },
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
- `useMusic()`: play and pause, respects autoplay rules. The first "Open invitation" gesture unlocks audio. **Music always loops** (owner requirement); themes cannot turn looping off.
- `<GuestFormSlot render={…}/>`: a headless component for the guest form (name, attendance, and message when the package has `congratulations`). The theme supplies the markup and styling; the platform owns submission, validation, Turnstile and error states. In `sample` or `preview` mode it is inert.
- `useReducedMotion()`, `<ThemeImage>` (responsive, lazy), and `formatDate()` for the invitation's locale and calendar.

**Enforcement:**
- **Static.** An ESLint boundary rule: `themes/**` may import only from `theme-sdk`, React and approved libraries, never from `server/`, `db`, `fetch` or `cookies`. The CSS lint forbids global selectors (`:root`, `body`, bare tags) outside the theme root.
- **Build-time `theme:validate`.** Checks:
  - The manifest parses.
  - Fields exist in the Field Library.
  - The theme renders every `validStates` entry at 360, 390, 430 and 1280 px without errors.
  - Playwright screenshots of every state are saved for human review.
  - JS and image budgets are met; missing assets are reported.
  - The print card renders for every valid state, with short and very long names, in Arabic and English.
  - The keepsake companion renders with 0, 1 and 200 messages, including a 500-character message.
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

### 7.1 Guarantee: adding a theme does not affect anything else

The owner asked: *"If I add a new theme to GitHub, will it affect anything else in my code?"* The design goal is **no**. This is how it is enforced, not just intended:

| Risk | How it is prevented |
|---|---|
| Having to edit central platform files to register a theme | The theme registry is **generated automatically** by scanning `themes/*/v*/manifest.ts` at build time. Adding a theme means adding one folder and nothing else. |
| The theme's CSS leaking into the site or other themes | CSS Modules only. A lint rule rejects global selectors. Invitation pages load no storefront CSS, and previews run in a sandboxed iframe. |
| The theme's JavaScript slowing down the site | Each theme version is a separate lazy-loaded chunk that is downloaded only on its own invitation page or preview. |
| A theme importing another theme or platform internals | A lint boundary rule: a theme may import only from `theme-sdk`, its own folder and approved libraries. The build fails otherwise. |
| A theme accidentally changing old themes or live invitations | Purchased versions are **frozen by content hash**; CI fails if a frozen folder changes. |
| A new theme going live half-finished | New versions always start in **DEVELOPMENT** and are invisible to customers until Admin activates them. |
| A theme crashing in the browser | Each theme renders inside an error boundary. A crash shows a branded fallback for that invitation and reports to Sentry; the rest of the site is unaffected. |
| A broken theme breaking the deploy | CI runs `theme:validate` on every PR. A broken theme **cannot be merged**, so it never reaches production. |
| A theme needing a new npm library | This is the one shared touchpoint (`package.json`). New libraries need an explicit review in the PR; most themes need none. |

The honest limit: theme code is still deployed with the app (Decision B). The protection comes from automated checks that block a bad theme before it ships. The runtime does not isolate an already-deployed bad theme; the error boundary contains a crash, but not every kind of fault.

---

## 8. WAYL payment lifecycle

**Confirmed from WAYL's official OpenAPI spec** (fetched from api.thewayl.com/reference on 2026-09-30, kept at `docs/vendor/wayl-openapi.v1.json`):
- Authentication: `X-WAYL-AUTHENTICATION: <merchant key>` on every call; `GET /api/v1/verify-auth-key` checks a key.
- `POST /api/v1/links` takes `env` (`live`/`test`), `referenceId` (unique), `total` (IQD, min 1000), `currency: IQD`, optional `lineItem[]`, `webhookUrl`, `webhookSecret` (10–255 chars), `redirectionUrl` (WAYL appends `referenceId` and `orderid`) and `linkExpiresIn` (1m–30d, default 1h). The store must be verified to create links.
- `GET /api/v1/links/{referenceId}` reads a link by **our** reference, which makes independent verification possible. `POST …/invalidate-if-pending` closes an unpaid link.
- Link statuses: Created, Pending, Processing, Complete, Delivered, Cancelled, Rejected, Returned. We treat Complete/Delivered as paid, Cancelled/Rejected as failed, Returned as flagged for the owner.
- Servers: production `api.thewayl.com`, testing `api.thewayl-staging.com`.

**Not in the spec:** the webhook payload and signature format. Deliveries are therefore only a *signal*: we store them (deduplicated), check an `x-wayl-signature-256` HMAC-SHA256 when present, and always re-read the link from WAYL before acting. A forged delivery can't mark anything paid.

**As built (M6):**
- `src/server/payments/wayl.ts` (client), `service.ts` (start, verify, webhook, reconcile), tables `payments` and `payment_webhook_events`.
- Reference = `<order number>-<attempt>`; links last 2 hours; an unpaid order can start new attempts at its snapshot price for 48 hours, then becomes `PAYMENT_EXPIRED`.
- Before a new attempt, the previous link is checked (it may have been paid) and cancelled at WAYL.
- The payment row is written **before** calling WAYL, so a lost response is found again by reference.
- Webhook secrets are derived per link from `TOKEN_SECRET` (nothing extra to configure).
- Webhooks are processed inline (fast; no queue yet); the reconciliation job (`POST /api/cron/reconcile-payments` or `pnpm payments:reconcile`) is the safety net.
- The redirect lands on the private receipt `/r/<token>?paid=1`, which verifies with WAYL and refreshes until confirmed.
- Admin → Orders shows each order's latest payment, a "Check with WAYL" button (`payments.view`) and "Mark as paid manually" with a required reason (`payments.override`, audited).
- Without `WAYL_API_KEY`, checkout still works and the team collects payment manually.
- Refunds through WAYL's API are not wired yet (later milestone).

The original plan, for reference:

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
          invitation → PUBLISHED, published_at=now(), expires_at=now()+30d
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
| Invitation page | 30 days after publication (plus extensions) | Record kept 24 months after expiry | Field values anonymized; record stub kept |
| Guest responses (attendance + messages) | Readable by Admin | 12 months after expiry (keepsake PDF produced first) | Deleted |
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
| M0 | Approval of this document | 1–3 | ✅ Approved |
| M1 ✅ | Foundation | 4 | Repo, CI, Drizzle schema and migrations, env validation, i18n with RTL, admin login + 2FA + RBAC, audit log, seed data. (Sentry and the nonce-based CSP moved to M11: Sentry needs an account, and CSP is best tuned once real pages exist.) |
| M2 ✅ | Admin catalog | 5–6 | Sections, Field Library, themes/versions registry, packages (with validStates enforcement), music library, R2 uploads, ordering |
| M3 ✅ | Theme engine + first theme | 8 | theme-sdk, registry, validate/freeze scripts, one reference theme in all its package states |
| M4 ✅ | Storefront | 7 | Homepage in the approved v2 design, occasions, catalog, theme page with live sample preview per package, order screens (details → preview/edit → contact + terms → receipt), SEO, sitemap, robots |
| M5 ✅ (backend) | Personalization → order | 9–10 | Field forms, server validation, personalized preview, customer info, legal acceptance, order snapshot, receipt page |
| M6 ✅ (live WAYL test deferred to M12, owner decision) | WAYL | 11–12 | Client against the official docs, mock server, sandbox tests, webhook inbox, verification, publication, reconciliation, manual publish |
| M7 ✅ | Invitation runtime | 13 | `/i` routing, canonical slug redirects, expiry page, OG, noindex, admin invitation view/edit/extend/unpublish |
| M8 ✅ | Guest features + print | 14–15 | Guest form stored (`guest_responses`, per-device correction, per-IP and per-invitation rate limits, live + `rsvp` only) with Admin replies and message hide/restore; optional **Cloudflare Turnstile** (on when its keys are set); **printable card** (receipt download after payment) and **keepsake PDF** (Admin) rendered by Chromium from per-theme print companions, stored with a `source_hash` so edits and new messages regenerate them. Simplification: PDFs are generated on request in the web process instead of a pg-boss worker; automatic keepsake at expiry moves to M11 housekeeping |
| M9 | Analytics + dashboard | 16 | Event capture, dashboard metrics |
| M10 | Legal, settings, contact, WhatsApp | 17 | Editable policies with versions, settings-driven footer and contact, WhatsApp flows |
| M11 | Hardening | 18–19 | Lighthouse/WebPageTest on real 4G profiles, axe accessibility, security review, backup + **tested restore**, runbooks |
| (moved up) | Hosting | — | Railway (app + Postgres) + Cloudflare R2/DNS ready now: `Dockerfile`, `railway.json`, `/api/health`, owner bootstrap; guide in `docs/runbooks/deploy.md`. The site can run in **manual payment mode** (owner WhatsApp + instructions, manual mark-paid) until WAYL is switched on |
| M12 | Staging → production | 20–23 | Staging on a temporary domain, WAYL test-mode check (`pnpm wayl:check`, needs the key in a new session + `api.thewayl-staging.com` allowed) and production validation with a real small payment, domain/DNS/HTTPS, launch checklist |

Tests are written inside each milestone. Coverage focuses on payment verification, webhook idempotency, state transitions, publication and expiry, RBAC, package field validation, theme availability, invoice totals, URL resolution and RSVP. The full E2E journey runs against the WAYL mock in CI and against WAYL test mode manually before M12.

---

## 12. What is needed from the owner

**Needed now** (to start M1–M3):
1. Approval of this architecture, or changes to it.
2. ~~Remaining decisions~~ — all answered (A, C, D, E, F, G, M).
3. ~~Brand name~~ — **Bahja / بهجه** (working name).
4. WAYL: a merchant account and **test-mode API token**, access to the official API reference, and your merchant dashboard settings. Also allow `wayl.io` and `api.thewayl.com` in this environment's network access so I can read the docs directly. They are currently blocked by the environment's network policy.

**Needed by M3/M4:**
- The first theme, delivered following **`docs/THEME_GUIDE.md`**. That covers the design, layered assets, motion sheet, package states, printable card and keepsake PDF.
- Homepage design reference(s).
- One or more MP3s for the music library.

**Can wait:**
- Hosting, R2 and Sentry accounts (local development uses Docker Postgres and MinIO)
- The domain
- Production WAYL keys
- The business WhatsApp number and email
- Legal text review by an Iraqi lawyer (I will draft the policies from the actual system behaviour)
- Kurdish (Sorani/Badini) translator
- Email provider account (D is approved)

## 13. Future: sections with a different format (pictures and messages)

The owner plans a section where people **add pictures and messages**, for example a shared memory book or guestbook. It is **not built in V1**, and V1 still has no customer uploads. These choices keep it addable later without a redesign:

1. **Experience type per section.** `sections.experience_type` is `INVITATION` for everything in V1. A new type (working name `CONTRIBUTION_BOOK`) will have:
   - its own customer flow and public page renderer, selected by this type at `/i/...`;
   - its own theme contract, extending the same theme SDK.

   Payments, orders, publication, expiry, packages, audit and analytics stay shared, so a new format reuses the whole commerce and lifecycle core.
2. **Guest contributions generalize guest responses.** `guest_responses` (name, attendance, message) is the V1 case. Pictures would be added as attachments linked to a response through the `assets` table, with a per-item moderation status. They would not be stored in new columns on the invitation.
3. **Field types are open-ended.** The Field Library's `type` list can gain `image`/`gallery` for owner-provided photos without changing how fields, packages or validation work.
4. **Storage is already external.** All media goes to object storage (R2) behind the CDN, never into database rows.
5. **What that future build must add, since user uploads change the risk profile:**
   - an upload pipeline: type/size checks, re-encoding, EXIF/location stripping, and possibly malware scanning;
   - rate limits and moderation tools in Admin;
   - storage quotas per package;
   - retention rules for photos;
   - Privacy Policy and Terms updates.

   These are deliberately not built now ("future-ready" does not mean building unused systems).

## Sources
- [Wayl Checkout – WordPress plugin](https://wordpress.org/plugins/wayl-checkout/)
- [Wayl API — Integration guide](https://wayl.io/docs)
- [Wayl API reference (Context7 index)](https://context7.com/websites/api_thewayl_reference)
- [Wayl MCP (Glama)](https://glama.ai/mcp/servers/muthanii/waylMCP)

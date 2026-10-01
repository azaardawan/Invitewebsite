# Putting Bahja online (Railway + Cloudflare)

**What runs where:**

| Piece | Service | Approximate cost |
|---|---|---|
| Website + admin (one container) | **Railway**, region EU West (Amsterdam) | Hobby plan, about $5–15/month |
| Database (PostgreSQL 16) | **Railway** Postgres, same project | included in the usage above |
| Images, covers and music | **Cloudflare R2** bucket behind `media.bahjaaa.com` | free up to 10 GB |
| Domain + DNS | **Cloudflare** (bahjaaa.com is already there) | already paid |

On every deploy, the container applies database migrations, runs the idempotent seed and starts the
site (`scripts/start.sh`). Railway restarts it if the health check (`/api/health`) fails.

Payment starts in **manual mode**: WAYL variables are left unset. Customers confirm their order, see
your payment instructions and WhatsApp button on their receipt, and you press **Mark as paid
manually** in Admin → Orders, which publishes the invitation. WAYL is switched on at the end by
adding its variables (see `payments.md`).

## Phase 1: staging on Railway's temporary address

1. **Railway account**
   1. Sign up at railway.com with GitHub.
   2. Choose the **Hobby** plan.
2. **Project**
   1. Click **New Project → Deploy from GitHub repo → azaardawan/invitewebsite** (once only: clicking twice creates two projects that are both billed).
   2. Under Settings → Source, pick the branch **`main`**. Claude's work reaches the site only after its pull request is merged into `main`.
   3. Under Settings → Regions, pick **EU West (Amsterdam)** (`europe-west4-drams3a`) for the website and, after step 3, for Postgres too.
   4. The build uses the repo's `Dockerfile` (`railway.json`).
3. **Database:** in the project, click **+ New → Database → PostgreSQL**. Railway's current template is PostgreSQL 18, which works.

   > Railway starts a first deploy immediately, before the database and variables exist, so that first deploy **fails. This is expected.** Its log says *"Bahja cannot start yet"* and lists the missing settings. Once steps 3–5 are done, click **Redeploy**.
4. **Cloudflare R2**
   1. Dashboard → **R2 Object Storage** → **Enable R2** (one time; asks for a payment method, the first 10 GB are free).
   2. **Create bucket** `bahja-media` (exactly this name, lowercase).
   3. Bucket → Settings → **Custom Domains** → `media.bahjaaa.com`; wait until it shows **Active**. Leave the `r2.dev` public URL disabled.
   4. R2 → **Manage API tokens** → **Create Account API token** with *Object Read & Write*, applied to `bahja-media` only, no IP filter.
   5. Keep the **Access Key ID** and **Secret Access Key** in your password manager (the secret is shown once).
   6. The **S3 endpoint** is `https://<account-id>.r2.cloudflarestorage.com`. If the bucket was created with the **EU jurisdiction**, it is `https://<account-id>.eu.r2.cloudflarestorage.com` (`.eu` goes **in the middle**, not at the end). Copy it from bucket → Settings → S3 API, without the `/bahja-media` suffix.
5. **Variables:** in the website service → Variables, add the following.
   - **Secrets:** make each one a random password of **40+ characters** with any password manager. Never reuse them, and never send them in chat.

   | Name | Value |
   |---|---|
   | `APP_ENV` | `staging` (becomes `production` in phase 2) |
   | `APP_URL` | the Railway address, e.g. `https://bahja-production.up.railway.app` (Settings → Networking → *Generate domain*) |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway fills it in) |
   | `TOTP_ENCRYPTION_KEY` | random 40+ characters. **Never change it after the first deploy**: admin 2FA depends on it. |
   | `TOKEN_SECRET` | random 40+ characters. **Never change it**: receipt links depend on it. |
   | `IP_HASH_SALT` | random 40+ characters |
   | `STORAGE_DRIVER` | `s3` |
   | `S3_ENDPOINT` | the R2 S3 endpoint |
   | `S3_BUCKET` | `bahja-media` |
   | `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | from the R2 token |
   | `MEDIA_PUBLIC_BASE_URL` | `https://media.bahjaaa.com` |
   | `BOOTSTRAP_OWNER_EMAIL` | your email (first deploy only) |
   | `BOOTSTRAP_OWNER_NAME` | your name |

   > **Saving variables:** after editing, Railway shows a bar with the pending changes at the top of the canvas. Nothing is saved or deployed until you click **Deploy** there. If your Railway account has 2FA, changes staged by Claude or another tool also wait for you to confirm them in this bar.

6. **Deploy and sign in**
   1. Wait for the deploy, then open the **Deploy Logs** and find the line `[bootstrap] Created owner … Temporary password (shown once): …`.
   2. Go to `<APP_URL>/admin` and sign in with that password.
   3. Change the password and set up 2FA (keep the recovery codes).
   4. Delete `BOOTSTRAP_OWNER_EMAIL` and `BOOTSTRAP_OWNER_NAME` from the variables. (Leaving them does no harm: they are ignored once any admin exists.)
   5. Upload a song in Admin → Music and play it. This proves the R2 settings and `media.bahjaaa.com` work.
      - *Upload failed* with `NoSuchBucket` in the Deploy Logs: wrong bucket name, or an EU bucket without `.eu` in `S3_ENDPOINT`.
      - `ENOTFOUND …cloudflarestorage.com.eu`: `.eu` was put at the end of `S3_ENDPOINT` instead of before `.r2`.
      - `S3_ENDPOINT: Invalid URL` at startup: the value still contains `<account-id>`, lacks `https://`, or has quotes or spaces.
7. **In Admin**
   1. Website settings: set the exchange rate, the business WhatsApp number, the payment instructions and the contact details (footer and Contact page).
   2. Legal policies: review the seeded drafts (terms, privacy, refund), adjust them (ideally with a lawyer) and publish each. Published versions can't be edited; publish a new version instead.
   3. Add your first real theme, its packages and its music, then place a test order end to end.

Staging is never indexed by search engines (`robots.txt` blocks everything unless `APP_ENV=production`).

## Phase 2: bahjaaa.com

1. **Railway:** website service → Settings → Networking → **Custom domain**. Add `bahjaaa.com` and `www.bahjaaa.com`; Railway shows a CNAME target for each.
2. **Cloudflare DNS**
   1. Add `CNAME @ → <target>` and `CNAME www → <target>`.
   2. Start with **DNS only** (grey cloud) until Railway shows the certificate as issued.
   3. After that, the orange proxy can be turned on with SSL/TLS mode **Full (strict)**.
3. **Variables:** set `APP_URL=https://bahjaaa.com` and `APP_ENV=production`, then redeploy.
4. **Checks**
   - `https://bahjaaa.com/api/health` returns `{"ok":true}`.
   - The homepage loads in all four languages.
   - `/robots.txt` allows indexing and lists the sitemap.
   - A test invitation link opens on a phone and shows a preview when shared on WhatsApp.

## Bot protection on the guest form (Cloudflare Turnstile)

Optional but recommended before going live. Without it, the guest form is protected by rate limits only.

1. Cloudflare dashboard → **Turnstile** → **Add widget**. Name it `Bahja`, add the hostnames
   (`invitewebsite-production.up.railway.app` now, `bahjaaa.com` later), widget mode **Managed**.
2. Copy the **Site Key** and the **Secret Key**.
3. Railway → website service → Variables: add `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` (both, or
   neither), then Deploy.

Guests normally see nothing; Cloudflare shows a checkbox only to suspicious visitors.

## Printable card and keepsake PDFs

PDFs are made on request by the Chromium inside the website container (the Docker image installs it)
and stored in R2 under `documents/`. Customers download the card from their receipt after payment;
Admin → Invitations → an invitation has **Download printable card** and **Download keepsake PDF**
(with **Regenerate**). Nothing to configure.

## Backups

Turn on Railway Postgres backups and know how to restore: see `backups.md` (includes the restore drill).

## Background jobs

The website runs its own daily housekeeping (guest data retention, keepsakes at expiry, cleanup) and,
when WAYL is on, the payment safety net every 10 minutes. Nothing to schedule. `DISABLE_SCHEDULER=1`
turns them off; `POST /api/cron/housekeeping` with `Authorization: Bearer $CRON_SECRET` runs it by hand.

## Later: WAYL

When the WAYL store is verified, add `WAYL_API_KEY`, `WAYL_ENV=test` and `CRON_SECRET`, and run the
test-mode check. Then switch to `WAYL_ENV=live` with the live key. See `payments.md`.

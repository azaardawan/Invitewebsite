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
   1. Click **New Project → Deploy from GitHub repo → azaardawan/invitewebsite**.
   2. Under Settings → Source, pick the branch Claude works on (`claude/great-cerf-ccdyba`) or `main` once merged.
   3. The build uses the repo's `Dockerfile` (`railway.json`).
3. **Database:** in the project, click **+ New → Database → PostgreSQL**.

   > Railway starts a first deploy immediately, before the database and variables exist, so that first deploy **fails. This is expected.** Its log says *"Bahja cannot start yet"* and lists the missing settings. Once steps 3–5 are done, click **Redeploy**.
4. **Cloudflare R2**
   1. Dashboard → R2 → **Create bucket** `bahja-media`.
   2. Bucket → Settings → **Custom domain** → `media.bahjaaa.com`.
   3. R2 → **Manage API tokens** → **Create token** with *Object Read & Write* on `bahja-media`.
   4. Keep the **Access Key ID**, **Secret Access Key** and the **S3 endpoint** (`https://<account-id>.r2.cloudflarestorage.com`) somewhere safe.
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

6. **Deploy and sign in**
   1. Wait for the deploy, then open the **Deploy Logs** and find the line `[bootstrap] Created owner … Temporary password (shown once): …`.
   2. Go to `<APP_URL>/admin` and sign in with that password.
   3. Change the password and set up 2FA (keep the recovery codes).
   4. Delete `BOOTSTRAP_OWNER_EMAIL` and `BOOTSTRAP_OWNER_NAME` from the variables.
7. **In Admin**
   1. Website settings: set the exchange rate, the business WhatsApp number and the payment instructions.
   2. Add your first real theme, its packages and its music, then place a test order end to end.

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

## Backups

On the Hobby plan, check that Railway Postgres **backups** are enabled for the database. A tested
restore is part of M11.

## Later: WAYL

When the WAYL store is verified, add `WAYL_API_KEY`, `WAYL_ENV=test` and `CRON_SECRET`, and run the
test-mode check. Then switch to `WAYL_ENV=live` with the live key. See `payments.md`.

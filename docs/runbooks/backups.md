# Backups and restoring (Railway Postgres)

## Turn backups on (once)
1. Railway → project → **Postgres** service → **Backups** tab.
2. Under the schedule, tick **Daily** (kept 6 days), **Weekly** (kept 1 month) and **Monthly** (kept 3 months).
3. Optional: **Point-in-time recovery** (restore to any minute in the last ~4 weeks), if your plan offers it.

Media (images, music, PDFs) lives in Cloudflare R2, which keeps its own redundant copies. Theme code
lives in GitHub. The database is the only thing these backups need to protect.

## Restore a backup (when something went wrong)
1. Postgres → **Backups** → find the backup by date → **Restore**.
2. Railway *stages* it: a new volume from that backup replaces the current one (the current one is
   kept, unmounted). Review the staged change and click **Deploy**.
3. Then redeploy the website service so it reconnects. Everything written after the backup's time is
   lost, so note what happened since (orders, payments) from the WAYL dashboard and WhatsApp.

## Restore drill (prove backups work, every few months)
`scripts/restore-drill.sh` dumps a database, restores it into a scratch database, checks that all
migrations are already applied and that key tables have the same row counts, then deletes the copy.

```sh
SOURCE_URL='<a database URL>' SCRATCH_URL='postgres://.../bahja_restore_drill' sh scripts/restore-drill.sh
```

Last drill: 2026-10-01 on a test database: dump 189 KB, restored with triggers (append-only audit log,
frozen legal versions), migrations a no-op, row counts identical. Repeat it against a copy of
production data before launch (from your computer with the Railway CLI: `railway connect Postgres`
gives a reachable URL for `SOURCE_URL`).

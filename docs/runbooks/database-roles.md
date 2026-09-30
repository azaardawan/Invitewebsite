# Database roles (production)

Development uses a single database user for simplicity. **Production must use two roles** so the
running application cannot rewrite history:

| Role | Used by | Rights |
|---|---|---|
| `bahja_owner` | Migrations only (`pnpm db:migrate` during deploy) | Owns all tables |
| `bahja_app` | The running web app and worker (`DATABASE_URL`) | DML on normal tables; **INSERT/SELECT only on `audit_logs`** |

Why: the append-only trigger on `audit_logs` stops accidental or malicious edits through the
app, but a table *owner* could disable a trigger. The app therefore must not be the owner.

```sql
-- Run once as a superuser when provisioning production (and staging).
CREATE ROLE bahja_owner LOGIN PASSWORD '<generated>';
CREATE ROLE bahja_app   LOGIN PASSWORD '<generated>';
CREATE DATABASE bahja OWNER bahja_owner;
\c bahja
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO bahja_app;

-- After migrations have run as bahja_owner:
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bahja_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bahja_app;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM bahja_app;

-- Future tables created by migrations inherit the same grants:
ALTER DEFAULT PRIVILEGES FOR ROLE bahja_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bahja_app;
ALTER DEFAULT PRIVILEGES FOR ROLE bahja_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO bahja_app;
```

This will be applied and verified as part of milestone M12 (staging deployment). Backups and the
tested restore procedure are covered in M11.

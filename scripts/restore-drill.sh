#!/bin/sh
# Restore drill: dump a database, restore it into a scratch database, check that migrations are
# already applied and the key tables have the same row counts, then drop the scratch copy.
#   SOURCE_URL=postgres://... SCRATCH_URL=postgres://.../bahja_restore_drill sh scripts/restore-drill.sh
# SCRATCH_URL's database is dropped and recreated: never point it at real data.
set -eu
: "${SOURCE_URL:?set SOURCE_URL}"
: "${SCRATCH_URL:?set SCRATCH_URL}"
case "$SCRATCH_URL" in *restore*) ;; *) echo "SCRATCH_URL database name must contain 'restore'" >&2; exit 1 ;; esac
scratch_db="${SCRATCH_URL##*/}"
admin_url="${SCRATCH_URL%/*}/postgres"
dump="$(mktemp -t bahja-dump.XXXXXX)"
trap 'rm -f "$dump"' EXIT

echo "1/4 dumping source"
pg_dump --format=custom --no-owner --no-privileges "$SOURCE_URL" > "$dump"
echo "    dump size: $(wc -c < "$dump") bytes"

echo "2/4 restoring into $scratch_db"
psql -q "$admin_url" -c "DROP DATABASE IF EXISTS \"$scratch_db\"" -c "CREATE DATABASE \"$scratch_db\""
pg_restore --no-owner --no-privileges --exit-on-error -d "$SCRATCH_URL" "$dump"

echo "3/4 migrations on the restored copy (must be a no-op)"
DATABASE_URL="$SCRATCH_URL" pnpm -s db:migrate

echo "4/4 comparing row counts"
for t in orders invitations guest_responses audit_logs legal_policy_versions themes; do
  a=$(psql -tA "$SOURCE_URL" -c "select count(*) from $t")
  b=$(psql -tA "$SCRATCH_URL" -c "select count(*) from $t")
  printf '    %-24s source=%-6s restored=%s\n' "$t" "$a" "$b"
  [ "$a" = "$b" ] || { echo "MISMATCH in $t" >&2; exit 1; }
done
psql -q "$admin_url" -c "DROP DATABASE \"$scratch_db\""
echo "Restore drill passed."

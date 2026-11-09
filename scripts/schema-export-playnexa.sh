#!/usr/bin/env bash
# Read-only, operator-driven physical schema + Flyway history export.
# No data rows, no secrets and no mutations. Do NOT commit raw exports.
set -euo pipefail
umask 077

: "${PGHOST:?Set the approved PostgreSQL host through the environment}"
: "${PGDATABASE:?Set the approved PostgreSQL database}"
: "${PGUSER:?Set an approved read-only schema inspection role}"
command -v pg_dump >/dev/null 2>&1 || { echo "pg_dump client is required" >&2; exit 2; }
command -v psql >/dev/null 2>&1 || { echo "psql client is required" >&2; exit 2; }

OUTPUT_DIR="${SCHEMA_EXPORT_DIR:-$PWD/schema-export}"
if [[ "$OUTPUT_DIR" == *$'\n'* || "$OUTPUT_DIR" == *$'\r'* ]]; then
  echo "Invalid output path" >&2; exit 2
fi
mkdir -p "$OUTPUT_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SCHEMA_FILE="$OUTPUT_DIR/playnexa-${STAMP}-schema.sql"
HISTORY_FILE="$OUTPUT_DIR/playnexa-${STAMP}-flyway.csv"
echo "Exporting schema (DDL only; no user/booking/payment data)."
pg_dump --schema-only --no-owner --no-privileges --file "$SCHEMA_FILE" 
echo "Exporting Flyway version history (metadata only)."
psql -X -v ON_ERROR_STOP=1 -q -c "COPY (SELECT installed_rank,version,description,checksum,success,installed_on FROM flyway_schema_history ORDER BY installed_rank) TO STDOUT WITH CSV HEADER" > "$HISTORY_FILE"
chmod 600 "$SCHEMA_FILE" "$HISTORY_FILE"
echo "Export complete in the operator-selected output directory."
echo "Review DDL for credentials/PII/defaults before sharing; keep all exports outside source control."

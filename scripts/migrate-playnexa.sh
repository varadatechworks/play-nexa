#!/usr/bin/env bash
# Safe, explicit Flyway CLI workflow for PlayNexa PostgreSQL.
# No automatic migration in plan/info/validate modes. No Flyway clean/repair.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_DIR="$ROOT/apps/backend/src/main/resources/db/migration"
MODE="${1:-plan}"

[[ -d "$SQL_DIR" ]] || { echo "Migration directory missing" >&2; exit 2; }
[[ "$MODE" =~ ^(plan|info|validate|migrate)$ ]] || {
  echo "Usage: $0 plan|info|validate|migrate" >&2; exit 2;
}

# Detect conflicting Flyway versions in this repository before any database call.
mapfile -t files < <(find "$SQL_DIR" -maxdepth 1 -type f -name 'V*__*.sql' -printf '%f\n' | sort -V)
declare -A seen=()
for file in "${files[@]}"; do
  version="${file%%__*}"
  if [[ -n "${seen[$version]:-}" ]]; then
    echo "ERROR duplicate Flyway version $version: ${seen[$version]} and $file" >&2
    exit 3
  fi
  seen[$version]="$file"
done

if [[ "$MODE" == "plan" ]]; then
  echo "READ-ONLY: ${#files[@]} versioned PostgreSQL SQL migrations at release source"
  printf '%s\n' "${files[@]}"
  echo "Compare against the TARGET database's flyway_schema_history before any apply."
  echo "This is a repository inventory, NOT a live database migration plan."
  exit 0
fi

command -v flyway >/dev/null 2>&1 || { echo "Install approved Flyway CLI" >&2; exit 2; }
: "${FLYWAY_URL:?Set FLYWAY_URL from approved secret store}"
: "${FLYWAY_USER:?Set FLYWAY_USER from approved secret store}"
: "${FLYWAY_PASSWORD:?Set FLYWAY_PASSWORD from approved secret store}"
[[ "$FLYWAY_URL" == jdbc:postgresql://* ]] || {
  echo "Only PostgreSQL JDBC targets are supported" >&2; exit 2;
}

if [[ "$MODE" == "migrate" ]]; then
  [[ "${MIGRATION_APPROVAL:-}" == "APPROVED" ]] || {
    echo "MIGRATION_APPROVAL=APPROVED required" >&2; exit 4;
  }
  [[ "${RESTORE_TESTED:-}" == "true" ]] || {
    echo "A successful backup restore test is required" >&2; exit 4;
  }
  : "${BACKUP_REFERENCE:?Record approved backup or snapshot reference}"
  : "${RELEASE_SHA:?Set the exact approved Git commit SHA}"
  CURRENT_SHA="$(git -C "$ROOT" rev-parse HEAD)"
  [[ "$CURRENT_SHA" == "$RELEASE_SHA" ]] || {
    echo "Release SHA mismatch; refusing migration" >&2; exit 4;
  }
  [[ -z "$(git -C "$ROOT" status --porcelain -- apps/backend/src/main/resources/db/migration)" ]] || {
    echo "Uncommitted migration changes; refusing migration" >&2; exit 4;
  }
  if [[ "${APP_ENV:-}" == "production" ]] &&
     [[ "$FLYWAY_URL" == *localhost* || "$FLYWAY_URL" == *127.0.0.1* ]]; then
    echo "Production migration cannot target localhost" >&2; exit 4;
  fi
  echo "Approved migration started; release SHA: $RELEASE_SHA; backup reference recorded."
  # Flyway reads connection secrets from its environment; no passwords printed.
  flyway -locations="filesystem:$SQL_DIR" -cleanDisabled=true -baselineOnMigrate=false validate
  flyway -locations="filesystem:$SQL_DIR" -cleanDisabled=true -baselineOnMigrate=false migrate
  echo "Migration command finished. Verify history, API health, checkout and refund smoke tests."
  exit 0
fi

flyway -locations="filesystem:$SQL_DIR" -cleanDisabled=true -baselineOnMigrate=false "$MODE"

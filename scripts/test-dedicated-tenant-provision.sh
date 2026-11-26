#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROVISION="$SCRIPT_DIR/provision-dedicated-tenant.sh"

valid=(
  PGHOST=127.0.0.1
  PGDATABASE=playnexa_test
  PGUSER=playnexa
  TENANT_ID=11111111-1111-4111-8111-111111111111
  TENANT_SLUG=arena-one
  TENANT_NAME="Arena One"
  HOSTING_MODE=CUSTOMER_HOSTED
  OWNER_USER_ID=22222222-2222-4222-8222-222222222222
  CONFIRM_OWNER_USER_ID=22222222-2222-4222-8222-222222222222
  PLAN_CODE=STANDARD
)

env "${valid[@]}" bash "$PROVISION" --validate-only >/dev/null

expect_invalid() {
  if env "${valid[@]}" "$@" bash "$PROVISION" --validate-only >/dev/null 2>&1; then
    printf 'Expected invalid provisioning input to fail: %s\n' "$*" >&2
    exit 1
  fi
}

expect_invalid HOSTING_MODE=MULTI_TENANT_SAAS
expect_invalid TENANT_SLUG=Bad_Slug
expect_invalid CONFIRM_OWNER_USER_ID=33333333-3333-4333-8333-333333333333
expect_invalid TENANT_ID=not-a-uuid

if bash "$PROVISION" --validate-only >/dev/null 2>&1; then
  printf 'Expected missing required environment to fail\n' >&2
  exit 1
fi

bash "$PROVISION" --help >/dev/null
printf 'Dedicated tenant provisioning validation tests passed.\n'

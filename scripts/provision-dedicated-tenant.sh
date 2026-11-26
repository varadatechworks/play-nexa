#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Provision a dedicated PlayNexa tenant and its first OWNER membership.

Required environment:
  PGHOST, PGDATABASE, PGUSER       PostgreSQL connection settings
  TENANT_ID                        UUID for the dedicated tenant
  TENANT_SLUG                      lowercase DNS-safe tenant slug
  TENANT_NAME                      display name (1-120 characters)
  HOSTING_MODE                     CUSTOMER_HOSTED or PLAYNEXA_MANAGED_SINGLE_TENANT
  OWNER_USER_ID                    existing users.id UUID
  CONFIRM_OWNER_USER_ID            must exactly equal OWNER_USER_ID
  PLAN_CODE                        subscription plan code

Use PGPASSWORD, PGPASSFILE or the platform secret manager for credentials.
Never put database passwords in command-line arguments.

Options:
  --validate-only                  validate inputs without connecting to PostgreSQL
  --help                           show this help

This script does not create/verify a SaaS domain and cannot enable shared SaaS.
USAGE
}

fail() {
  printf 'Provisioning validation failed: %s\n' "$1" >&2
  exit 2
}

if [[ "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

validate_only=false
if [[ "${1:-}" == "--validate-only" ]]; then
  validate_only=true
elif [[ $# -gt 0 ]]; then
  fail "unknown option: $1"
fi

required=(PGHOST PGDATABASE PGUSER TENANT_ID TENANT_SLUG TENANT_NAME HOSTING_MODE OWNER_USER_ID CONFIRM_OWNER_USER_ID PLAN_CODE)
for name in "${required[@]}"; do
  [[ -n "${!name:-}" ]] || fail "$name is required"
done

uuid_re='^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
[[ "$TENANT_ID" =~ $uuid_re ]] || fail "TENANT_ID must be a UUID"
[[ "$OWNER_USER_ID" =~ $uuid_re ]] || fail "OWNER_USER_ID must be a UUID"
[[ "$TENANT_SLUG" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]] || fail "TENANT_SLUG must be 1-63 lowercase letters, digits or internal hyphens"
[[ -n "${TENANT_NAME//[[:space:]]/}" ]] || fail "TENANT_NAME must not be blank"
[[ ${#TENANT_NAME} -le 120 ]] || fail "TENANT_NAME must be at most 120 characters"
[[ "$TENANT_NAME" != *$'\n'* && "$TENANT_NAME" != *$'\r'* ]] || fail "TENANT_NAME must be a single line"
case "$HOSTING_MODE" in
  CUSTOMER_HOSTED|PLAYNEXA_MANAGED_SINGLE_TENANT) ;;
  *) fail "HOSTING_MODE must be CUSTOMER_HOSTED or PLAYNEXA_MANAGED_SINGLE_TENANT" ;;
esac
[[ "$CONFIRM_OWNER_USER_ID" == "$OWNER_USER_ID" ]] || fail "CONFIRM_OWNER_USER_ID must exactly match OWNER_USER_ID"
[[ "$PLAN_CODE" =~ ^[A-Z0-9][A-Z0-9_-]{0,39}$ ]] || fail "PLAN_CODE must be 1-40 uppercase letters, digits, underscores or hyphens"

if [[ "$validate_only" == true ]]; then
  printf 'Validated dedicated tenant provisioning inputs for %s (%s). No database was changed.\n' "$TENANT_SLUG" "$HOSTING_MODE"
  exit 0
fi

command -v psql >/dev/null 2>&1 || fail "psql is required; install the PostgreSQL client"

psql --no-psqlrc --set=ON_ERROR_STOP=1 \
  --set=tenant_id="$TENANT_ID" \
  --set=tenant_slug="$TENANT_SLUG" \
  --set=tenant_name="$TENANT_NAME" \
  --set=hosting_mode="$HOSTING_MODE" \
  --set=owner_user_id="$OWNER_USER_ID" \
  --set=plan_code="$PLAN_CODE" <<'SQL'
BEGIN;

SELECT EXISTS (
    SELECT 1 FROM users WHERE id = :'owner_user_id'::uuid
) AS owner_exists \gset
\if :owner_exists
\else
    \echo 'Owner user does not exist; create the account before provisioning the tenant.'
    \quit 3
\endif

INSERT INTO playnexa_tenants (id, slug, display_name, lifecycle_status, hosting_mode)
VALUES (:'tenant_id'::uuid, :'tenant_slug', :'tenant_name', 'ACTIVE', :'hosting_mode')
ON CONFLICT (id) DO UPDATE
SET display_name = EXCLUDED.display_name,
    lifecycle_status = 'ACTIVE',
    updated_at = now()
WHERE playnexa_tenants.slug = EXCLUDED.slug
  AND playnexa_tenants.hosting_mode = EXCLUDED.hosting_mode;

SELECT EXISTS (
    SELECT 1 FROM playnexa_tenants
    WHERE id = :'tenant_id'::uuid
      AND slug = :'tenant_slug'
      AND hosting_mode = :'hosting_mode'
      AND lifecycle_status = 'ACTIVE'
) AS tenant_matches \gset
\if :tenant_matches
\else
    \echo 'Tenant ID already exists with a different slug or hosting mode.'
    \quit 3
\endif

SELECT EXISTS (
    SELECT 1 FROM playnexa_tenant_memberships
    WHERE tenant_id = :'tenant_id'::uuid
      AND role = 'OWNER'
      AND membership_status = 'ACTIVE'
      AND user_id <> :'owner_user_id'::uuid
) AS conflicting_owner \gset
\if :conflicting_owner
    \echo 'An active OWNER already exists. Use the reviewed ownership-transfer process instead.'
    \quit 3
\endif

INSERT INTO playnexa_tenant_subscriptions (id, tenant_id, plan_code, subscription_status, starts_at)
VALUES (gen_random_uuid(), :'tenant_id'::uuid, :'plan_code', 'ACTIVE', now())
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO playnexa_tenant_memberships (id, tenant_id, user_id, role, membership_status, invited_by)
VALUES (gen_random_uuid(), :'tenant_id'::uuid, :'owner_user_id'::uuid, 'OWNER', 'ACTIVE', NULL)
ON CONFLICT (tenant_id, user_id) DO UPDATE
SET role = 'OWNER', membership_status = 'ACTIVE', updated_at = now();

COMMIT;
SQL

printf 'Dedicated tenant %s provisioned in %s mode.\n' "$TENANT_SLUG" "$HOSTING_MODE"
printf 'Set PLAYNEXA_TENANT_CONTEXT_ENABLED=true, PLAYNEXA_HOSTING_MODE=%s and PLAYNEXA_TENANT_ID=%s in the dedicated deployment.\n' \
  "$(if [[ "$HOSTING_MODE" == "CUSTOMER_HOSTED" ]]; then printf 'customer-hosted'; else printf 'playnexa-managed-single-tenant'; fi)" "$TENANT_ID"
printf 'Shared SaaS remains disabled; this script provisions dedicated hosting only.\n'

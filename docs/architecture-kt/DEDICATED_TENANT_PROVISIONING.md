# Dedicated tenant bootstrap runbook

This runbook provisions the control-plane records required to enable request-scoped tenant context for **one dedicated database**. It supports customer-hosted and PlayNexa-managed single-tenant deployments only.

It does not provision shared SaaS, create or verify DNS records, deploy infrastructure, create the first user account, migrate existing business data to tenant IDs, or certify data-plane isolation.

## Prerequisites

1. Apply the PlayNexa Flyway migrations through V66 to the dedicated PostgreSQL database.
2. Create the initial administrator account using the approved account-bootstrap process. Record its existing users.id UUID.
3. Create a unique tenant UUID and lowercase slug for this database.
4. Obtain the database connection through environment variables or .pgpass / a secret manager. Do not put a database password in shell history or command arguments.
5. Confirm there is no other active OWNER membership for the tenant.

## Validate inputs first

```bash
export PGHOST=127.0.0.1
export PGDATABASE=playnexa
export PGUSER=playnexa
# Supply PGPASSWORD through a secret manager or use PGPASSFILE.

export TENANT_ID=11111111-1111-4111-8111-111111111111
export TENANT_SLUG=arena-one
export TENANT_NAME="Arena One"
export HOSTING_MODE=CUSTOMER_HOSTED
export OWNER_USER_ID=22222222-2222-4222-8222-222222222222
export CONFIRM_OWNER_USER_ID="$OWNER_USER_ID"
export PLAN_CODE=STANDARD

bash scripts/provision-dedicated-tenant.sh --validate-only
```

HOSTING_MODE must be CUSTOMER_HOSTED or PLAYNEXA_MANAGED_SINGLE_TENANT. The script rejects MULTI_TENANT_SAAS.

## Apply the bootstrap

After reviewing the target database and owner identity:

```bash
bash scripts/provision-dedicated-tenant.sh
```

The script uses one PostgreSQL transaction and parameterized psql literals. It:

- Creates or idempotently activates the tenant registry row, but rejects an existing tenant ID with a different slug or hosting mode.
- Creates an ACTIVE subscription if one does not already exist. Existing subscription states are not silently reactivated or overwritten; provisioning aborts if the existing state is not TRIAL or ACTIVE.
- Adds or confirms the specified user's ACTIVE OWNER membership.
- Refuses to proceed if a different active OWNER already exists.
- Rolls back all changes if any validation or database statement fails.

The owner user must already exist. CONFIRM_OWNER_USER_ID must exactly match OWNER_USER_ID to make the privileged assignment explicit.

## Dedicated application environment

Set the matching values in the deployment secret/configuration store.

For customer-hosted:

```bash
PLAYNEXA_TENANT_CONTEXT_ENABLED=true
PLAYNEXA_HOSTING_MODE=customer-hosted
PLAYNEXA_TENANT_ID=11111111-1111-4111-8111-111111111111
```

For PlayNexa-managed single-tenant:

```bash
PLAYNEXA_TENANT_CONTEXT_ENABLED=true
PLAYNEXA_HOSTING_MODE=playnexa-managed-single-tenant
PLAYNEXA_TENANT_ID=11111111-1111-4111-8111-111111111111
```

The backend resolves the tenant from the configured ID and checks that the registry row is ACTIVE and its hosting mode matches. It does not trust an X-Tenant-ID request header.

## Verification and rollback

- Confirm the tenant row, subscription and OWNER membership in the dedicated database.
- Call /actuator/health; then verify a normal authenticated request resolves the configured tenant.
- Confirm an invalid tenant ID, mismatched hosting mode or suspended tenant fails closed.
- Verify the owner can access admin pages and a normal customer can only access customer functions.
- Record the database backup and deployment configuration before changing tenant context.

To undo a bootstrap before the arena has live data, use a separately reviewed tenant deprovisioning procedure. Do not manually delete tenant rows after bookings, payments, invoices or audit events exist.

## Shared SaaS release gate

This script cannot create a SaaS tenant or open shared hosting. The hard-coded code-level SaaS block remains in TenantContextFilter. Shared SaaS still requires tenant IDs and database-enforced isolation on all tenant-owned tables, transaction-local database context, composite relationships, asynchronous boundary scoping, and hostile cross-tenant tests. See Tenant context and SaaS release gate.

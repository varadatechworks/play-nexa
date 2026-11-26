# Tenant context and shared SaaS release gate

## Implemented foundation in this branch

- Verified tenant-domain resolution normalizes hostnames, requires a verified domain, ACTIVE tenant lifecycle and a TRIAL/ACTIVE subscription whose period has not expired.
- Dedicated hosting modes now distinguish customer-hosted and PlayNexa-managed single-tenant deployments; both remain dedicated databases with the full feature set.
- Request tenant context is resolved from the verified host for SaaS, or from the deployment's configured tenant ID for a dedicated tenant. No client-supplied tenant header is trusted.
- Tenant membership authorization runs after JWT authentication. It replaces global tenant-admin/operator/coach/shopkeeper/customer roles with the role attached to the resolved tenant.
- Customer users are enrolled as CUSTOMER in a tenant on first authenticated visit; privileged roles require an explicit ACTIVE tenant membership. SUPER_ADMIN remains a platform-level role.
- Privileged MFA evaluation uses ACTIVE OWNER/ADMIN tenant membership when a tenant context is present; global ADMIN does not carry into a tenant where the user is not an administrator. Platform SUPER_ADMIN always requires MFA. JWTs use the PlayNexa issuer by default (`JWT_ISSUER` can override it).
- Operator assignment, front-desk and equipment-inventory authorization consults ACTIVE tenant membership when tenant context is present. A global ADMIN role cannot bypass another tenant's operator facility scope; platform SUPER_ADMIN retains the platform-wide bypass.
- Context is cleared in a finally block at request completion. Health checks do not require tenant context.
- The context filter is opt-in through `PLAYNEXA_TENANT_CONTEXT_ENABLED=false` by default. Existing dedicated deployments remain unchanged until their tenant registry and memberships are provisioned.
- `SharedHostingSafetyGateFilter` continues to return 503 for SaaS/unknown modes. `ProductionConfigurationGuard` only accepts the three dedicated hosting configurations; SaaS remains rejected.

## Explicitly not complete

This foundation is **not** tenant data-plane isolation and does not authorize shared SaaS. No tenant-owned business table has yet been made tenant-scoped by database policy. The tenant context and membership filter alone cannot prevent a missing tenant predicate in a service query.

## Required before shared SaaS can be enabled

1. Add a non-null tenant identifier to every tenant-owned table, backfill the dedicated tenant safely, and make inserts derive tenant ID only from trusted server context.
2. Add tenant-aware unique constraints and composite foreign keys so child records cannot reference another tenant's parent rows.
3. Enable and FORCE PostgreSQL row-level security for every tenant-owned table. Policies must use transaction-local `app.tenant_id`; the runtime database role must not be superuser or BYPASSRLS.
4. Bind tenant context to every transaction with transaction-local `set_config('app.tenant_id', ..., true)`. Do not use a pooled connection's persistent session variable.
5. Scope every scheduled job, queue consumer, report, cache key, object-storage key, notification, webhook and payment-merchant mapping to a tenant.
6. Add hostile cross-tenant tests for SELECT/INSERT/UPDATE/DELETE, booking/slot holds, check-in, payments/refunds, Shop, promotions, memberships, coaching, tournaments, invoices, reports, files, webhooks and background jobs.
7. Rehearse database migrations, backup/restore and deployment for customer-hosted, PlayNexa-managed single-tenant and multi-tenant SaaS independently.

## Current release decision

- Customer-hosted and PlayNexa-managed single-tenant modes are permitted by configuration, but require a provisioned tenant ID and verified deployment-specific setup before enabling tenant context.
- Shared multi-tenant SaaS remains **disabled**. The 503 safety gate and production configuration guard must not be removed until every item above is verified in CI and a hostile cross-tenant review is complete.

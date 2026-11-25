# Multi-tenant control-plane foundation (V62)

## Scope of this increment

V62 adds the persistence foundation for PlayNexa's SaaS control plane:
- Tenant registry with an explicit lifecycle and a database-enforced SaaS hosting-mode guard.
- Globally unique hostname registry with pending/verified/revoked states, DNS TXT verification metadata, and hashed verification-token storage.
- User-to-tenant membership records with tenant-scoped roles and suspension/revocation states.
- One subscription lifecycle record per tenant.
- Idempotent provisioning-job ledger with safe error codes and retry counters.

## Security boundaries

This is deliberately NOT a shared-hosting release. It does not add tenant IDs to existing booking, payment, membership, tournament, shop, notification, audit, media, reporting, or background-job tables. It does not resolve a tenant from an HTTP Host header, mint tenant-bound JWTs, or expose tenant onboarding APIs. The production guard and fail-closed SaaS HTTP gate must remain enabled.

Do not store DNS verification tokens in plaintext. The future verification service must generate high-entropy one-time values, persist only a cryptographic hash, compare hashes in constant time, rate-limit verification, and revoke/rotate tokens on success or abuse.

## Required next increments before SaaS enablement

1. Tenant-aware authentication: verified-host resolution, active membership lookup, tenant-bound JWT claims, suspended-tenant rejection, and no client-supplied tenant ID as authorization.
2. Data-plane isolation: tenant IDs and composite tenant foreign keys for every tenant-owned business record; tenant-aware repository methods; PostgreSQL RLS with a transaction-scoped tenant context.
3. Scope async jobs, payment webhooks, refunds, invoices, object storage, caches, notifications, exports, analytics and audit.
4. Provisioning workflow: authenticated owner onboarding, DNS challenge, transactional lifecycle transitions, idempotent job execution, safe retries, tenant-specific merchant settings and subscription enforcement.
5. Hostile isolation tests: tenant A cannot read, mutate, refund, check in, export or infer tenant B data across every API and async path.
6. Staging proof: concurrent booking tests, Razorpay sandbox lifecycle, backup/restore, monitoring and operational runbooks.

## Validation

TenantControlPlaneSchemaIntegrationTest verifies V62 table/column installation, globally unique hostname ownership, and database rejection of invalid slugs/hosting modes. Passing this test proves only the control-plane schema foundation; it does not certify tenant isolation.
